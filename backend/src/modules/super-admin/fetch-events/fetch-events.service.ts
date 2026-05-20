import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { parseUniversityCsv, parseUniversityMatrix, ParsedSourceRow } from './services/csv.parser';
import { SyncService } from './services/sync.service';
import { UniversitySyncJobService } from './services/university-sync-job.service';
import { UniversityEventsTimezoneService } from './services/university-events-timezone.service';
import { parseXlsxToMatrix } from './services/xlsx.parser';

interface ListEventsParams {
  search?: string;
  category?: string;
  sourceId?: string;
  /** Calendar day YYYY-MM-DD in UNIVERSITY_EVENTS_TIMEZONE (default America/New_York) — filters stored startDate to that local day. */
  onDateUtc?: string;
  /** If true: `startDate` from now through end of the **current calendar month** in UNIVERSITY_EVENTS_TIMEZONE. */
  upcoming?: boolean;
  latest?: boolean;
  trending?: boolean;
  sort?: 'startDate' | 'firstSeenAt' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

@Injectable()
export class FetchEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SyncService,
    private readonly syncJobs: UniversitySyncJobService,
    private readonly config: ConfigService,
    private readonly universityTz: UniversityEventsTimezoneService,
  ) {}

  // ---------- SOURCES ----------

  async ingestCsv(
    buffer: Buffer,
    fileName?: string,
  ): Promise<{
    totalInCsv: number;
    created: number;
    skipped: number;
    sourceIds: string[];
    batchId: string;
    syncJobId?: string;
  }> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Empty file');
    }
    const rows = this.parseUniversitySpreadsheetBuffer(buffer, fileName);
    if (rows.length === 0) {
      throw new BadRequestException(
        'No valid rows with http(s) URLs. Expected columns such as "University Name" + "Website URL", or an "Events URL" / "Calendar URL" column when available.',
      );
    }
    const batchId = randomUUID();
    const safeName = (fileName || 'upload.csv').slice(0, 500);
    const uploadedAt = new Date();
    const result = await this.ingestRows(rows, { batchId, fileName: safeName, uploadedAt });
    let syncJobId: string | undefined;
    if (
      this.config.get('UNIVERSITY_SYNC_JOBS_DISABLED') !== '1' &&
      this.config.get('UNIVERSITY_SYNC_AUTO_QUEUE') !== '0' &&
      result.sourceIds.length > 0
    ) {
      syncJobId = await this.syncJobs.enqueueBatch(batchId, result.sourceIds);
    }
    return { ...result, batchId, syncJobId };
  }

  async addUrlSource(universityName: string, url: string) {
    const cleanUrl = url?.trim();
    if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl)) {
      throw new BadRequestException('A valid http(s) URL is required');
    }
    const name = (universityName || '').trim() || this.hostnameFromUrl(cleanUrl);
    const { sourceIds } = await this.ingestRows([{ universityName: name, url: cleanUrl }], null);
    return { sourceId: sourceIds[0] };
  }

  private async ingestRows(
    rows: ParsedSourceRow[],
    batch: { batchId: string; fileName: string; uploadedAt: Date } | null,
  ) {
    let created = 0;
    let skipped = 0;
    const sourceIds: string[] = [];

    const batchFields = batch
      ? {
          csvBatchId: batch.batchId,
          csvFileName: batch.fileName,
          csvUploadedAt: batch.uploadedAt,
        }
      : {};

    for (const row of rows) {
      try {
        // Only set csv batch metadata on create. If we also set it on update, a later CSV
        // that reuses the same URL would move the row to the new batch and the previous
        // upload’s batch would vanish from the UI (listBatches is derived from sources).
        const upserted = await this.prisma.universitySource.upsert({
          where: { url: row.url },
          update: { universityName: row.universityName, isActive: true },
          create: {
            universityName: row.universityName,
            url: row.url,
            status: 'pending',
            ...batchFields,
          },
        });
        const isNew = upserted.createdAt.getTime() === upserted.updatedAt.getTime();
        if (isNew) created++;
        else skipped++;
        sourceIds.push(upserted.id);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          skipped++;
        } else {
          throw e;
        }
      }
    }

    return { totalInCsv: rows.length, created, skipped, sourceIds };
  }

  async listSources() {
    const sources = await this.prisma.universitySource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sources.map((s) => ({
      id: s.id,
      universityName: s.universityName,
      url: s.url,
      status: s.status,
      lastSyncedAt: s.lastSyncedAt,
      lastError: s.lastError,
      totalEvents: s.totalEvents,
      isActive: s.isActive,
      csvBatchId: s.csvBatchId,
      csvFileName: s.csvFileName,
      csvUploadedAt: s.csvUploadedAt,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Aggregate sources by CSV upload batch. Returns one entry per CSV file uploaded,
   * with summary counts. Excludes sources without a batch (those go under "Manual additions").
   */
  async listBatches() {
    const sources = await this.prisma.universitySource.findMany({
      where: { csvBatchId: { not: null } },
      orderBy: { csvUploadedAt: 'desc' },
      select: {
        id: true,
        csvBatchId: true,
        csvFileName: true,
        csvUploadedAt: true,
        status: true,
        totalEvents: true,
      },
    });

    const grouped = new Map<
      string,
      {
        batchId: string;
        fileName: string;
        uploadedAt: Date | null;
        totalSources: number;
        totalEvents: number;
        pending: number;
        syncing: number;
        completed: number;
        failed: number;
      }
    >();

    for (const s of sources) {
      if (!s.csvBatchId) continue;
      const existing = grouped.get(s.csvBatchId) ?? {
        batchId: s.csvBatchId,
        fileName: s.csvFileName || 'upload.csv',
        uploadedAt: s.csvUploadedAt,
        totalSources: 0,
        totalEvents: 0,
        pending: 0,
        syncing: 0,
        completed: 0,
        failed: 0,
      };
      existing.totalSources += 1;
      existing.totalEvents += s.totalEvents;
      if (s.status === 'pending') existing.pending += 1;
      else if (s.status === 'syncing') existing.syncing += 1;
      else if (s.status === 'completed') existing.completed += 1;
      else if (s.status === 'failed') existing.failed += 1;
      if (!existing.uploadedAt && s.csvUploadedAt) existing.uploadedAt = s.csvUploadedAt;
      grouped.set(s.csvBatchId, existing);
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const ta = a.uploadedAt ? a.uploadedAt.getTime() : 0;
      const tb = b.uploadedAt ? b.uploadedAt.getTime() : 0;
      return tb - ta;
    });
  }

  async syncBatch(batchId: string) {
    const sources = await this.prisma.universitySource.findMany({
      where: { csvBatchId: batchId, isActive: true },
      select: { id: true },
    });
    if (sources.length === 0) {
      throw new NotFoundException('No sources found for this batch');
    }
    const ids = sources.map((s) => s.id);
    if (this.config.get('UNIVERSITY_SYNC_JOBS_DISABLED') === '1') {
      void (async () => {
        for (const id of ids) {
          await this.sync.syncSource(id);
        }
      })();
      return { ok: true, queued: ids.length };
    }
    const jobId = await this.syncJobs.enqueueBatch(batchId, ids);
    return { ok: true, queued: ids.length, jobId };
  }

  async deleteBatch(batchId: string) {
    const result = await this.prisma.universitySource.deleteMany({
      where: { csvBatchId: batchId },
    });
    return { ok: true, deleted: result.count };
  }

  // ---------- PUBLIC-FACING (no auth) ----------

  /**
   * Active sources only, with a derived logoUrl from Google's favicon service
   * (no manual config needed for each university).
   * Includes **scraped URL feeds** (Super Admin → Fetch events) merged in and sorted by name.
   */
  async listPublicUniversities() {
    const sources = await this.prisma.universitySource.findMany({
      where: { isActive: true },
      orderBy: { universityName: 'asc' },
    });
    const legacy = sources.map((s) => ({
      id: s.id,
      universityName: s.universityName,
      url: s.url,
      logoUrl: this.deriveLogoUrl(s.url),
      totalEvents: s.totalEvents,
      lastSyncedAt: s.lastSyncedAt,
      feedKind: 'legacy' as const,
    }));

    const scrapedSources = await this.prisma.scrapedEventSource.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { events: true } } },
    });
    const scraped = scrapedSources.map((s) => ({
      id: s.id,
      universityName: s.name,
      url: s.websiteUrl,
      logoUrl: this.deriveLogoUrl(s.websiteUrl),
      totalEvents: s._count.events,
      lastSyncedAt: s.lastSyncedAt,
      feedKind: 'scraped' as const,
    }));

    const merged = [...legacy, ...scraped];
    merged.sort((a, b) =>
      a.universityName.localeCompare(b.universityName, undefined, { sensitivity: 'base' }),
    );
    return merged;
  }

  async getPublicUniversity(id: string) {
    const source = await this.prisma.universitySource.findUnique({
      where: { id },
    });
    if (source?.isActive) {
      return {
        id: source.id,
        universityName: source.universityName,
        url: source.url,
        logoUrl: this.deriveLogoUrl(source.url),
        totalEvents: source.totalEvents,
        lastSyncedAt: source.lastSyncedAt,
        ingestionWindowUtc: this.buildIngestionWindowUtc(),
        feedKind: 'legacy' as const,
      };
    }

    const scraped = await this.prisma.scrapedEventSource.findFirst({
      where: { id, active: true },
    });
    if (scraped) {
      const totalEvents = await this.prisma.scrapedEventRecord.count({ where: { sourceId: id } });
      return {
        id: scraped.id,
        universityName: scraped.name,
        url: scraped.websiteUrl,
        logoUrl: this.deriveLogoUrl(scraped.websiteUrl),
        totalEvents,
        lastSyncedAt: scraped.lastSyncedAt,
        ingestionWindowUtc: this.buildIngestionWindowUtc(),
        feedKind: 'scraped' as const,
      };
    }

    throw new NotFoundException('University not found');
  }

  /**
   * Same rules as university sync: **current calendar month** in UNIVERSITY_EVENTS_TIMEZONE.
   * Exposed for public UI (calendar bounds, copy). `horizonDays` = number of days in that month.
   */
  private buildIngestionWindowUtc(now = new Date()) {
    const win = this.universityTz.getCurrentCalendarMonthWindow(now);

    return {
      timeZone: win.timeZone,
      firstDayInclusive: win.firstDayInclusive,
      lastDayInclusive: win.lastDayInclusive,
      horizonDays: win.horizonDays,
      currentMonthEndInclusive: win.currentMonthEndInclusive,
      computedAt: win.computedAtIso,
    };
  }

  async syncOne(sourceId: string) {
    const exists = await this.prisma.universitySource.findUnique({ where: { id: sourceId } });
    if (!exists) throw new NotFoundException('Source not found');
    if (this.config.get('UNIVERSITY_SYNC_JOBS_DISABLED') === '1') {
      void this.sync.syncSource(sourceId);
      return { ok: true };
    }
    const jobId = await this.syncJobs.enqueueSingle(sourceId);
    return { ok: true, jobId };
  }

  async syncAll() {
    if (this.config.get('UNIVERSITY_SYNC_JOBS_DISABLED') === '1') {
      void this.sync.syncAllActiveSources();
      return { ok: true };
    }
    const jobId = await this.syncJobs.enqueueAllActive();
    return { ok: true, jobId };
  }

  async listSyncJobs(limit?: number) {
    const rows = await this.syncJobs.listJobs(limit ?? 40);
    return rows.map((j) => ({
      id: j.id,
      kind: j.kind,
      batchId: j.batchId,
      status: j.status,
      progressDone: j.progressDone,
      progressTotal: j.progressTotal,
      currentSourceId: j.currentSourceId,
      message: j.message,
      error: j.error,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
      startedAt: j.startedAt,
      completedAt: j.completedAt,
    }));
  }

  async getSyncJob(jobId: string) {
    const j = await this.syncJobs.getJob(jobId);
    if (!j) throw new NotFoundException('Job not found');
    return {
      id: j.id,
      kind: j.kind,
      batchId: j.batchId,
      status: j.status,
      progressDone: j.progressDone,
      progressTotal: j.progressTotal,
      currentSourceId: j.currentSourceId,
      message: j.message,
      error: j.error,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
      startedAt: j.startedAt,
      completedAt: j.completedAt,
    };
  }

  async listRecentRuns(limit = 50) {
    const safe = Math.min(200, Math.max(1, limit));
    const runs = await this.prisma.universityEventSyncRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: safe,
      include: {
        source: { select: { id: true, universityName: true, url: true } },
      },
    });
    return runs.map((r) => ({
      id: r.id,
      sourceId: r.sourceId,
      universityName: r.source?.universityName ?? '(deleted source)',
      url: r.source?.url ?? null,
      status: r.status, // running | completed | failed
      eventsAdded: r.eventsAdded,
      eventsUpdated: r.eventsUpdated,
      eventsSkipped: r.eventsSkipped,
      error: r.error,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      durationMs:
        r.completedAt && r.startedAt
          ? r.completedAt.getTime() - r.startedAt.getTime()
          : null,
    }));
  }

  async deleteSource(sourceId: string) {
    const exists = await this.prisma.universitySource.findUnique({ where: { id: sourceId } });
    if (!exists) throw new NotFoundException('Source not found');
    await this.prisma.universitySource.delete({ where: { id: sourceId } });
    return { ok: true };
  }

  async toggleSourceActive(sourceId: string, isActive: boolean) {
    return this.prisma.universitySource.update({
      where: { id: sourceId },
      data: { isActive },
    });
  }

  // ---------- EVENTS ----------

  async listEvents(params: ListEventsParams) {
    const sid = params.sourceId?.trim();
    if (sid) {
      const isUni = await this.prisma.universitySource.findUnique({
        where: { id: sid },
        select: { id: true, isActive: true },
      });
      if (!isUni?.isActive) {
        const scraped = await this.prisma.scrapedEventSource.findFirst({
          where: { id: sid, active: true },
          select: { id: true },
        });
        if (scraped) {
          return this.listScrapedSourceEvents(params);
        }
      }
    }

    return this.listUniversityEvents(params);
  }

  private async listUniversityEvents(params: ListEventsParams) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 24));

    const andParts: Prisma.UniversityEventWhereInput[] = [{ status: 'active' }];

    if (params.search?.trim()) {
      const q = params.search.trim();
      andParts.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { venue: { contains: q } },
          { organizer: { contains: q } },
        ],
      });
    }
    if (params.category?.trim()) {
      andParts.push({ category: params.category.trim() });
    }
    if (params.sourceId?.trim()) {
      andParts.push({ sourceId: params.sourceId.trim() });
    }
    if (params.onDateUtc?.trim()) {
      const day = params.onDateUtc.trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        const bounds = this.universityTz.getUtcBoundsForLocalCalendarDay(day);
        if (bounds) {
          andParts.push({
            AND: [
              { startDate: { not: null } },
              {
                OR: [
                  {
                    AND: [
                      { startDate: { gte: bounds.startUtc } },
                      { startDate: { lt: bounds.endExclusiveUtc } },
                    ],
                  },
                  {
                    AND: [
                      { endDate: { not: null } },
                      { startDate: { lt: bounds.endExclusiveUtc } },
                      { endDate: { gte: bounds.startUtc } },
                    ],
                  },
                ],
              },
            ],
          });
        }
      }
    }

    const now = new Date();
    if (params.upcoming) {
      const win = this.universityTz.getCurrentCalendarMonthWindow(now);
      andParts.push({
        AND: [
          { startDate: { not: null } },
          { startDate: { lt: win.endExclusiveUtc } },
          {
            OR: [
              { AND: [{ endDate: { not: null } }, { endDate: { gte: now } }] },
              { AND: [{ endDate: null }, { startDate: { gte: now } }] },
            ],
          },
        ],
      });
    }

    if (params.trending) {
      const sinceFirstSeen = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      andParts.push({
        firstSeenAt: { gte: sinceFirstSeen },
        OR: [
          { startDate: { gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) } },
          { startDate: null },
        ],
      });
    }

    const where: Prisma.UniversityEventWhereInput =
      andParts.length === 1 ? andParts[0] : { AND: andParts };

    const orderBy: Prisma.UniversityEventOrderByWithRelationInput | Prisma.UniversityEventOrderByWithRelationInput[] =
      (() => {
        const order = params.order === 'desc' ? 'desc' : 'asc';
        if (params.latest) return { firstSeenAt: 'desc' };
        if (params.trending) return [{ firstSeenAt: 'desc' }, { startDate: 'asc' }];
        switch (params.sort) {
          case 'title':
            return { title: order };
          case 'firstSeenAt':
            return { firstSeenAt: order };
          default:
            return { startDate: order };
        }
      })();

    const categoryWhere: Prisma.UniversityEventWhereInput = { ...where };

    const includeSource = {
      source: { select: { id: true, universityName: true, url: true } },
    } as const;

    const singleSourceId = params.sourceId?.trim();
    /** GPT/crawl often produced multiple rows for the same real-world event; collapse for public UI. */
    const DEDUPE_FETCH_CAP = 1200;

    let total: number;
    let items: Array<
      Prisma.UniversityEventGetPayload<{
        include: { source: { select: { id: true; universityName: true; url: true } } };
      }>
    >;

    if (singleSourceId) {
      const rawItems = await this.prisma.universityEvent.findMany({
        where,
        orderBy,
        take: DEDUPE_FETCH_CAP,
        include: includeSource,
      });
      const deduped = this.dedupeUniversityEventsByFingerprint(rawItems);
      total = deduped.length;
      items = deduped.slice((page - 1) * pageSize, page * pageSize);
    } else {
      const [count, pageItems] = await Promise.all([
        this.prisma.universityEvent.count({ where }),
        this.prisma.universityEvent.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: includeSource,
        }),
      ]);
      total = count;
      items = pageItems;
    }

    const categoryAgg = await this.prisma.universityEvent.groupBy({
      by: ['category'],
      where: categoryWhere,
      _count: { _all: true },
    });

    return {
      total,
      page,
      pageSize,
      items: items.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        summary: e.summary,
        startDate: e.startDate,
        endDate: e.endDate,
        rawDateText: e.rawDateText,
        rawTimeText: e.rawTimeText,
        venue: e.venue,
        organizer: e.organizer,
        category: e.category,
        tags: this.safeParseJsonArray(e.tags),
        registrationLink: e.registrationLink,
        imageUrl: e.imageUrl,
        detailUrl: e.detailUrl,
        contactInfo: this.eventRowContactInfo(e),
        extractionConfidence: this.eventRowExtractionConfidence(e),
        firstSeenAt: e.firstSeenAt,
        source: e.source,
      })),
      categories: categoryAgg
        .filter((c) => c.category)
        .map((c) => ({ name: c.category as string, count: c._count._all })),
    };
  }

  /** Public listing for {@link ScrapedEventRecord} (URL scrape / Localist feeds). */
  private async listScrapedSourceEvents(params: ListEventsParams) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 24));
    const sourceId = params.sourceId!.trim();

    const srcRow = await this.prisma.scrapedEventSource.findUnique({
      where: { id: sourceId },
    });
    if (!srcRow?.active) {
      return { total: 0, page, pageSize, items: [], categories: [] };
    }

    const andParts: Prisma.ScrapedEventRecordWhereInput[] = [{ sourceId }];

    if (params.search?.trim()) {
      const q = params.search.trim();
      andParts.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { venue: { contains: q } },
          { organizer: { contains: q } },
        ],
      });
    }
    if (params.category?.trim()) {
      andParts.push({ category: params.category.trim() });
    }
    if (params.onDateUtc?.trim()) {
      const day = params.onDateUtc.trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        const bounds = this.universityTz.getUtcBoundsForLocalCalendarDay(day);
        if (bounds) {
          andParts.push({
            AND: [
              { startDate: { not: null } },
              {
                OR: [
                  {
                    AND: [
                      { startDate: { gte: bounds.startUtc } },
                      { startDate: { lt: bounds.endExclusiveUtc } },
                    ],
                  },
                  {
                    AND: [
                      { endDate: { not: null } },
                      { startDate: { lt: bounds.endExclusiveUtc } },
                      { endDate: { gte: bounds.startUtc } },
                    ],
                  },
                ],
              },
            ],
          });
        }
      }
    }

    const now = new Date();
    if (params.upcoming) {
      const win = this.universityTz.getCurrentCalendarMonthWindow(now);
      andParts.push({
        AND: [
          { startDate: { not: null } },
          { startDate: { lt: win.endExclusiveUtc } },
          {
            OR: [
              { AND: [{ endDate: { not: null } }, { endDate: { gte: now } }] },
              { AND: [{ endDate: null }, { startDate: { gte: now } }] },
            ],
          },
        ],
      });
    }

    if (params.trending) {
      const sinceSynced = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      andParts.push({
        syncedAt: { gte: sinceSynced },
        OR: [
          { startDate: { gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) } },
          { startDate: null },
        ],
      });
    }

    const where: Prisma.ScrapedEventRecordWhereInput =
      andParts.length === 1 ? andParts[0] : { AND: andParts };

    const orderBy:
      | Prisma.ScrapedEventRecordOrderByWithRelationInput
      | Prisma.ScrapedEventRecordOrderByWithRelationInput[] = (() => {
      const order = params.order === 'desc' ? 'desc' : 'asc';
      if (params.latest) return { syncedAt: 'desc' };
      if (params.trending) return [{ syncedAt: 'desc' }, { startDate: 'asc' }];
      switch (params.sort) {
        case 'title':
          return { title: order };
        case 'firstSeenAt':
          return { createdAt: order };
        default:
          return { startDate: order };
      }
    })();

    const categoryWhere: Prisma.ScrapedEventRecordWhereInput = { ...where };

    const [total, pageItems, categoryAgg] = await Promise.all([
      this.prisma.scrapedEventRecord.count({ where }),
      this.prisma.scrapedEventRecord.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.scrapedEventRecord.groupBy({
        by: ['category'],
        where: categoryWhere,
        _count: { _all: true },
      }),
    ]);

    const sourcePayload = {
      id: srcRow.id,
      universityName: srcRow.name,
      url: srcRow.websiteUrl,
    };

    return {
      total,
      page,
      pageSize,
      items: pageItems.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        summary: null,
        startDate: e.startDate,
        endDate: e.endDate,
        rawDateText: null,
        rawTimeText: null,
        venue: e.venue,
        organizer: e.organizer,
        category: e.category,
        tags: this.tagsFromScrapedStorage(e.tags),
        registrationLink: null,
        imageUrl: e.image,
        detailUrl: e.sourceUrl,
        contactInfo: null,
        extractionConfidence: null,
        firstSeenAt: e.createdAt,
        source: sourcePayload,
      })),
      categories: categoryAgg
        .filter((c) => c.category)
        .map((c) => ({ name: c.category as string, count: c._count._all })),
    };
  }

  async deleteEvent(eventId: string) {
    await this.prisma.universityEvent.delete({ where: { id: eventId } }).catch(() => null);
    return { ok: true };
  }

  // ---------- helpers ----------

  /**
   * CSV text or Excel (.xlsx / legacy .xls via SheetJS). ZIP magic-bytes used when extension is wrong.
   */
  private parseUniversitySpreadsheetBuffer(buffer: Buffer, fileName?: string): ParsedSourceRow[] {
    const lower = (fileName || '').toLowerCase();
    const pkZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
    const forceExcel = lower.endsWith('.xlsx') || lower.endsWith('.xls');

    if (forceExcel || pkZip) {
      try {
        const matrix = parseXlsxToMatrix(buffer);
        const parsed = parseUniversityMatrix(matrix);
        if (parsed.length > 0 || forceExcel) {
          return parsed;
        }
      } catch (e) {
        if (forceExcel) {
          throw new BadRequestException(`Could not read spreadsheet: ${(e as Error).message}`);
        }
      }
    }

    return parseUniversityCsv(buffer.toString('utf-8'));
  }

  private hostnameFromUrl(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  /** Google's S2 favicon service — works for any public domain with no config. */
  private deriveLogoUrl(url: string): string {
    const host = this.hostnameFromUrl(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  }

  /** `contactInfo` exists on DB rows; Prisma `GetPayload` types can lag until `prisma generate`. */
  private eventRowContactInfo(row: unknown): string | null {
    if (!row || typeof row !== 'object') return null;
    const c = (row as { contactInfo?: string | null }).contactInfo;
    return c ?? null;
  }

  private eventRowExtractionConfidence(row: unknown): number | null {
    if (!row || typeof row !== 'object') return null;
    const c = (row as { extractionConfidence?: number | null }).extractionConfidence;
    return typeof c === 'number' && Number.isFinite(c) ? c : null;
  }

  private safeParseJsonArray(s: string | null): string[] {
    if (!s) return [];
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  /** Scraped rows store tags as comma-separated text; university rows use JSON array strings. */
  private tagsFromScrapedStorage(s: string | null): string[] {
    if (!s) return [];
    const trimmed = s.trim();
    if (trimmed.startsWith('[')) {
      try {
        const v = JSON.parse(trimmed);
        return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
      } catch {
        /* fall through */
      }
    }
    return trimmed
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  /** Matches sync.service dedupe normalization so list API hides duplicate GPT rows. */
  private normalizeFingerprintPart(s: string): string {
    const raw = (s || '').normalize('NFKD').replace(/\p{M}/gu, '');
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
  }

  private eventFingerprint(e: { title: string; startDate: Date | null; rawDateText: string | null }): string {
    const title = this.normalizeFingerprintPart(e.title);
    const date =
      e.startDate != null
        ? e.startDate.toISOString().slice(0, 10)
        : this.normalizeFingerprintPart(e.rawDateText || '').slice(0, 96);
    return `${title}|${date}`;
  }

  private dedupeUniversityEventsByFingerprint<
    T extends { title: string; startDate: Date | null; rawDateText: string | null },
  >(rows: T[]): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const row of rows) {
      const k = this.eventFingerprint(row);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(row);
    }
    return out;
  }
}
