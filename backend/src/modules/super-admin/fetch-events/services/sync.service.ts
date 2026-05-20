import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WebScraperService, type ScrapedPage } from './web-scraper.service';
import { GptExtractorService, ExtractedEvent } from './gpt-extractor.service';
import { UniversityEventValidationService } from './university-event-validation.service';
import { UniversityEventsTimezoneService, type UniversityIngestionWindow, universityEventRangeOverlapsWindow } from './university-events-timezone.service';
import type { EventCandidate } from './event-candidate.types';
import { condenseListingTextForGpt, sha256hex } from './crawl-text.util';

interface SyncResult {
  sourceId: string;
  status: 'completed' | 'failed';
  eventsAdded: number;
  eventsUpdated: number;
  eventsSkipped: number;
  error?: string;
}

const DEFAULT_INTERVAL_HOURS = 6;

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

@Injectable()
export class SyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncService.name);
  private timer: NodeJS.Timeout | null = null;
  /** In-flight per source so concurrent /sync calls don't double-fire. */
  private inFlight = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly scraper: WebScraperService,
    private readonly gpt: GptExtractorService,
    private readonly config: ConfigService,
    private readonly validator: UniversityEventValidationService,
    private readonly universityTz: UniversityEventsTimezoneService,
  ) {}

  onModuleInit() {
    const hours = Number(this.config.get('UNIVERSITY_SYNC_INTERVAL_HOURS')) || DEFAULT_INTERVAL_HOURS;
    if (this.config.get('UNIVERSITY_SYNC_DISABLED') === '1' || hours <= 0) {
      this.logger.log('Background sync disabled');
      return;
    }
    const intervalMs = hours * 60 * 60 * 1000;
    this.timer = setInterval(() => {
      this.syncAllActiveSources().catch((e) =>
        this.logger.error(`Scheduled sync failed: ${(e as Error).message}`),
      );
    }, intervalMs);
    if (typeof this.timer.unref === 'function') this.timer.unref();
    this.logger.log(`Background university-event sync scheduled every ${hours}h`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Run all active sources with bounded parallelism (default 3; cap 12). */
  async syncAllActiveSources(): Promise<SyncResult[]> {
    const sources = await this.prisma.universitySource.findMany({
      where: { isActive: true },
      orderBy: { lastSyncedAt: 'asc' },
    });
    const rawParallel = Number(this.config.get('UNIVERSITY_SYNC_MAX_PARALLEL'));
    const maxParallel =
      Number.isFinite(rawParallel) && rawParallel >= 1 ? Math.min(rawParallel, 12) : 3;
    return this.runWithConcurrency(sources.map((s) => () => this.syncSource(s.id)), maxParallel);
  }

  async syncSource(sourceId: string): Promise<SyncResult> {
    if (this.inFlight.has(sourceId)) {
      return { sourceId, status: 'failed', eventsAdded: 0, eventsUpdated: 0, eventsSkipped: 0, error: 'already syncing' };
    }
    this.inFlight.add(sourceId);

    const source = await this.prisma.universitySource.findUnique({ where: { id: sourceId } });
    if (!source) {
      this.inFlight.delete(sourceId);
      return { sourceId, status: 'failed', eventsAdded: 0, eventsUpdated: 0, eventsSkipped: 0, error: 'source not found' };
    }

    const run = await this.prisma.universityEventSyncRun.create({
      data: { sourceId, status: 'running' },
    });
    await this.prisma.universitySource.update({
      where: { id: sourceId },
      data: { status: 'syncing', lastError: null },
    });

    let added = 0;
    let updated = 0;
    let skipped = 0;

    try {
      const crawlDisabled = this.config.get('UNIVERSITY_CRAWL_DISABLED') === '1';
      const pages = crawlDisabled
        ? [await this.scraper.fetchAndClean(source.url)]
        : await this.scraper.crawlFromSeed(source.url);

      const pageMeta = pages.map((p) => ({
        pageUrl: p.url.slice(0, 2048),
        urlHash: sha256hex(p.url),
        contentHash: sha256hex(p.cleanedText),
      }));

      const rawChunk = Number(this.config.get('UNIVERSITY_GPT_CHUNK_CHARS'));
      const chunkChars =
        Number.isFinite(rawChunk) && rawChunk > 2000 ? Math.min(rawChunk, 48_000) : 12_000;
      const rawPageCap = Number(this.config.get('UNIVERSITY_GPT_PAGE_TEXT_MAX'));
      const pageTextCap =
        Number.isFinite(rawPageCap) && rawPageCap > 2000 ? Math.min(rawPageCap, 48_000) : 28_000;

      const { forGpt: pagesForGpt, skippedPages } = await this.filterPagesForIncrementalGpt(
        sourceId,
        pages,
        pageMeta,
      );

      const chunks = this.buildGptChunks(pagesForGpt, chunkChars, pageTextCap);
      const parserCandidates = this.dedupeParserCandidates(
        pagesForGpt.flatMap((p) => p.eventCandidates ?? []),
      );
      const minParserFirstRaw = Number(this.config.get('UNIVERSITY_PARSER_FIRST_MIN'));
      const minParserFirst =
        Number.isFinite(minParserFirstRaw) && minParserFirstRaw >= 1
          ? Math.min(40, Math.floor(minParserFirstRaw))
          : 4;

      this.logger.log(
        `Sync ${source.universityName}: crawl_pages=${pages.length}, gpt_pages=${pagesForGpt.length}, unchanged_skipped=${skippedPages}, parser_candidates=${parserCandidates.length}, text_chunks=${chunks.length}`,
      );

      const chunkGapMs = Math.max(
        0,
        Number(this.config.get('UNIVERSITY_GPT_CHUNK_DELAY_MS')) || 350,
      );
      const rawGptPar = Number(this.config.get('UNIVERSITY_GPT_CHUNK_PARALLEL'));
      const gptParallel = Number.isFinite(rawGptPar) && rawGptPar >= 1 ? Math.min(rawGptPar, 8) : 3;

      const persistWin = this.universityTz.getCurrentCalendarMonthWindow(new Date());
      const todayLocalYmd = this.universityTz.getTodayLocalIsoDate(new Date());
      this.logger.log(
        `Sync ${source.universityName}: persist_window=${persistWin.firstDayInclusive}..${persistWin.lastDayInclusive} (${persistWin.timeZone})`,
      );

      const allEvents: ExtractedEvent[] = [];

      if (pagesForGpt.length === 0) {
        this.logger.log(`Sync ${source.universityName}: all pages unchanged — skipping GPT`);
      } else if (this.gpt.isReady() && parserCandidates.length >= minParserFirst) {
        this.logger.log(
          `Sync ${source.universityName}: parser-first validate path (${parserCandidates.length} candidates → GPT)`,
        );
        const validated = await this.gpt.validateCandidates({
          universityName: source.universityName,
          sourceUrl: source.url,
          timeZone: persistWin.timeZone,
          todayLocalYmd,
          firstDayInclusiveLocal: persistWin.firstDayInclusive,
          lastDayInclusiveLocal: persistWin.lastDayInclusive,
          ingestionStartUtc: persistWin.startUtc.toISOString(),
          ingestionEndExclusiveUtc: persistWin.endExclusiveUtc.toISOString(),
          candidates: parserCandidates,
        });
        allEvents.push(...validated);
      } else {
        if (parserCandidates.length > 0) {
          this.logger.log(
            `Sync ${source.universityName}: parser candidates=${parserCandidates.length} < ${minParserFirst} — condensed listing extract`,
          );
        }
        for (let wave = 0; wave < chunks.length; wave += gptParallel) {
          const slice = chunks.slice(wave, wave + gptParallel);
          const waveResults = await Promise.all(
            slice.map((ch, j) => {
              const idx = wave + j;
              return this.gpt.extract({
                universityName: source.universityName,
                sourceUrl: source.url,
                cleanedText: ch.text,
                candidateImages: ch.images,
                detailLinks: ch.links,
                timeZone: persistWin.timeZone,
                todayLocalYmd,
                firstDayLocalYmd: persistWin.firstDayInclusive,
                lastDayLocalYmd: persistWin.lastDayInclusive,
                ingestionStartUtcIso: persistWin.startUtc.toISOString(),
                ingestionEndExclusiveUtcIso: persistWin.endExclusiveUtc.toISOString(),
                chunkIndex: chunks.length > 1 ? idx + 1 : undefined,
                chunkTotal: chunks.length > 1 ? chunks.length : undefined,
              });
            }),
          );
          for (const batch of waveResults) {
            allEvents.push(...batch);
          }
          if (chunkGapMs > 0 && wave + gptParallel < chunks.length) {
            await sleep(chunkGapMs);
          }
        }
      }

      const mergedDeduped = this.dedupeExtractedBatch(allEvents);
      const mergedEvents = this.gpt.filterExtractedByIngestionWindow(mergedDeduped, persistWin);
      if (mergedEvents.length < mergedDeduped.length) {
        this.logger.log(
          `Sync ${source.universityName}: current-month overlap filter dropped ${mergedDeduped.length - mergedEvents.length} extracted row(s) (no overlap with ${persistWin.firstDayInclusive}…${persistWin.lastDayInclusive} ${persistWin.timeZone})`,
        );
      }

      const rawDbPar = Number(this.config.get('UNIVERSITY_DB_UPSERT_PARALLEL'));
      const dbParallel = Number.isFinite(rawDbPar) && rawDbPar >= 1 ? Math.min(rawDbPar, 24) : 12;
      const upsertResults = await this.runWithConcurrency(
        mergedEvents.map((ev) => () => this.upsertEvent(sourceId, source.url, persistWin, ev)),
        dbParallel,
      );
      for (const r of upsertResults) {
        if (r === undefined) continue;
        if (r === 'added') added++;
        else if (r === 'updated') updated++;
        else if (r === 'skipped') skipped++;
      }

      const activeRows = await this.prisma.universityEvent.findMany({
        where: { sourceId, status: 'active' },
        select: { id: true, startDate: true, endDate: true },
      });
      const toArchiveIds = activeRows
        .filter(
          (r) =>
            !r.startDate ||
            !universityEventRangeOverlapsWindow(r.startDate, r.endDate, persistWin),
        )
        .map((r) => r.id);
      let archivedCount = 0;
      if (toArchiveIds.length > 0) {
        const archived = await this.prisma.universityEvent.updateMany({
          where: { id: { in: toArchiveIds } },
          data: { status: 'archived' },
        });
        archivedCount = archived.count;
      }
      if (archivedCount > 0) {
        this.logger.log(
          `Sync ${source.universityName}: archived ${archivedCount} active row(s) with no overlap on current month (${persistWin.firstDayInclusive}…${persistWin.lastDayInclusive} ${persistWin.timeZone})`,
        );
      }

      if (pageMeta.length > 0 && pagesForGpt.length > 0) {
        await this.persistPageContentHashes(sourceId, pageMeta);
      }

      const totalActive = await this.prisma.universityEvent.count({
        where: { sourceId, status: 'active' },
      });

      await this.prisma.universityEventSyncRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          eventsAdded: added,
          eventsUpdated: updated,
          eventsSkipped: skipped,
          completedAt: new Date(),
        },
      });
      await this.prisma.universitySource.update({
        where: { id: sourceId },
        data: {
          status: 'completed',
          lastSyncedAt: new Date(),
          totalEvents: totalActive,
          lastError: null,
        },
      });
      this.logger.log(
        `Synced ${source.universityName} — added=${added} updated=${updated} skipped=${skipped}`,
      );
      return { sourceId, status: 'completed', eventsAdded: added, eventsUpdated: updated, eventsSkipped: skipped };
    } catch (e) {
      const message = (e as Error).message || 'sync failed';
      this.logger.error(`Sync failed for ${source.universityName}: ${message}`);
      await this.prisma.universityEventSyncRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          eventsAdded: added,
          eventsUpdated: updated,
          eventsSkipped: skipped,
          error: message.slice(0, 2000),
          completedAt: new Date(),
        },
      });
      await this.prisma.universitySource.update({
        where: { id: sourceId },
        data: { status: 'failed', lastError: message.slice(0, 2000) },
      });
      return { sourceId, status: 'failed', eventsAdded: added, eventsUpdated: updated, eventsSkipped: skipped, error: message };
    } finally {
      this.inFlight.delete(sourceId);
    }
  }

  /**
   * Dedupe key: aggressively normalized title + calendar date (or raw date text).
   * Venue is intentionally omitted — GPT often varies/absents venue for the same listing row,
   * which previously created many duplicate DB rows.
   */
  private normalizeForDedupeKeyPart(s: string): string {
    const raw = (s || '').normalize('NFKD').replace(/\p{M}/gu, '');
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
  }

  private normalizeDetailKeyPart(url: string | undefined | null): string {
    if (!url) return '';
    try {
      const u = new URL(url);
      u.hash = '';
      let path = u.pathname.replace(/\/+$/, '');
      if (path.length < 1) path = '/';
      return `${u.hostname}${path}`.toLowerCase().slice(0, 220);
    } catch {
      return '';
    }
  }

  private buildExternalKey(ev: ExtractedEvent): string {
    const title = this.normalizeForDedupeKeyPart(ev.title);
    let dateBucket = '';
    if (ev.startDate) {
      dateBucket = new Date(ev.startDate).toISOString().slice(0, 10);
    } else {
      dateBucket = this.normalizeForDedupeKeyPart(ev.rawDateText || '').slice(0, 96);
    }
    const detailKey = this.normalizeDetailKeyPart(ev.detailUrl);
    return createHash('sha1').update(`${title}|${dateBucket}|${detailKey}`).digest('hex');
  }

  /** Read optional `contactInfo` (schema field; some tooling caches older Prisma types). */
  private existingContactInfo(row: unknown): string | null {
    if (!row || typeof row !== 'object') return null;
    const c = (row as { contactInfo?: string | null }).contactInfo;
    return c ?? null;
  }

  private existingExtractionConfidence(row: unknown): number | null {
    if (!row || typeof row !== 'object') return null;
    const c = (row as { extractionConfidence?: number | null }).extractionConfidence;
    return typeof c === 'number' && Number.isFinite(c) ? c : null;
  }

  private async upsertEvent(
    sourceId: string,
    seedUrl: string,
    win: UniversityIngestionWindow,
    ev: ExtractedEvent,
  ): Promise<'added' | 'updated' | 'skipped'> {
    const gate = this.validator.shouldPersist(ev, win, seedUrl);
    if (!gate.ok) return 'skipped';

    if (!ev.title) return 'skipped';
    const extractionConfidence = this.validator.mergeConfidence(
      this.validator.computeLocalConfidence(ev, seedUrl),
      ev.modelQaScore,
    );

    const externalKey = this.buildExternalKey(ev);

    let existing = await this.prisma.universityEvent.findUnique({
      where: { sourceId_externalKey: { sourceId, externalKey } },
    });

    const tagsJson = ev.tags && ev.tags.length > 0 ? JSON.stringify(ev.tags) : null;
    const startDate = ev.startDate ? new Date(ev.startDate) : null;
    const endDate = ev.endDate ? new Date(ev.endDate) : null;

    // Merge into an older row that used the previous venue-inclusive key or minor GPT drift.
    if (!existing && startDate) {
      const ymd = startDate.toISOString().slice(0, 10);
      const dayStart = new Date(`${ymd}T00:00:00.000Z`);
      const dayEnd = new Date(`${ymd}T23:59:59.999Z`);
      const titleNorm = this.normalizeForDedupeKeyPart(ev.title);
      if (titleNorm.length >= 4) {
        const candidates = await this.prisma.universityEvent.findMany({
          where: {
            sourceId,
            status: 'active',
            startDate: { gte: dayStart, lte: dayEnd },
          },
          take: 80,
        });
        existing =
          candidates.find((c) => this.normalizeForDedupeKeyPart(c.title) === titleNorm) ?? null;
      }
    }

    if (!existing) {
      const data = {
        sourceId,
        externalKey,
        title: ev.title,
        description: ev.description ?? null,
        summary: ev.summary ?? null,
        startDate,
        endDate,
        rawDateText: ev.rawDateText ?? null,
        rawTimeText: ev.rawTimeText ?? null,
        venue: ev.venue ?? null,
        organizer: ev.organizer ?? null,
        category: ev.category ?? null,
        tags: tagsJson,
        registrationLink: ev.registrationLink ?? null,
        imageUrl: ev.imageUrl ?? null,
        detailUrl: ev.detailUrl ?? null,
        contactInfo: ev.contactInfo ?? null,
        extractionConfidence,
        status: 'active',
      } as Prisma.UniversityEventUncheckedCreateInput;
      await this.prisma.universityEvent.create({ data });
      return 'added';
    }

    // Detect meaningful change before update.
    const changed =
      existing.description !== (ev.description ?? null) ||
      existing.summary !== (ev.summary ?? null) ||
      (existing.startDate?.getTime() ?? null) !== (startDate?.getTime() ?? null) ||
      (existing.endDate?.getTime() ?? null) !== (endDate?.getTime() ?? null) ||
      existing.venue !== (ev.venue ?? null) ||
      existing.organizer !== (ev.organizer ?? null) ||
      existing.category !== (ev.category ?? null) ||
      existing.tags !== tagsJson ||
      existing.registrationLink !== (ev.registrationLink ?? null) ||
      existing.imageUrl !== (ev.imageUrl ?? null) ||
      existing.detailUrl !== (ev.detailUrl ?? null) ||
      this.existingContactInfo(existing) !== (ev.contactInfo ?? null) ||
      this.existingExtractionConfidence(existing) !== extractionConfidence;

    const updateData = {
      externalKey,
      title: ev.title,
      description: ev.description ?? existing.description,
      summary: ev.summary ?? existing.summary,
      startDate: startDate ?? existing.startDate,
      endDate: endDate ?? existing.endDate,
      rawDateText: ev.rawDateText ?? existing.rawDateText,
      rawTimeText: ev.rawTimeText ?? existing.rawTimeText,
      venue: ev.venue ?? existing.venue,
      organizer: ev.organizer ?? existing.organizer,
      category: ev.category ?? existing.category,
      tags: tagsJson ?? existing.tags,
      registrationLink: ev.registrationLink ?? existing.registrationLink,
      imageUrl: ev.imageUrl ?? existing.imageUrl,
      detailUrl: ev.detailUrl ?? existing.detailUrl,
      contactInfo: ev.contactInfo ?? this.existingContactInfo(existing),
      extractionConfidence,
      lastSeenAt: new Date(),
      status: 'active',
    } as Prisma.UniversityEventUpdateInput;

    await this.prisma.universityEvent.update({
      where: { id: existing.id },
      data: updateData,
    });

    return changed ? 'updated' : 'skipped';
  }

  /** Collapse duplicate rows returned across GPT chunks before DB upserts (saves writes + API drift). */
  private dedupeExtractedBatch(events: ExtractedEvent[]): ExtractedEvent[] {
    const map = new Map<string, ExtractedEvent>();
    for (const ev of events) {
      if (!ev.title) continue;
      const key = `${this.normalizeForDedupeKeyPart(ev.title)}|${this.dateBucketForBatchKey(ev)}|${this.normalizeDetailKeyPart(ev.detailUrl)}`;
      const prev = map.get(key);
      if (!prev) map.set(key, ev);
      else map.set(key, this.mergeRicherEvent(prev, ev));
    }
    return [...map.values()];
  }

  private dateBucketForBatchKey(ev: ExtractedEvent): string {
    if (ev.startDate) {
      const d = new Date(ev.startDate);
      return isNaN(d.getTime()) ? this.normalizeForDedupeKeyPart(ev.rawDateText || '').slice(0, 96) : d.toISOString().slice(0, 10);
    }
    return this.normalizeForDedupeKeyPart(ev.rawDateText || '').slice(0, 96);
  }

  private mergeRicherEvent(a: ExtractedEvent, b: ExtractedEvent): ExtractedEvent {
    const score = (e: ExtractedEvent) =>
      (e.description?.length ?? 0) +
      (e.summary?.length ?? 0) +
      (e.venue ? 20 : 0) +
      (e.registrationLink ? 15 : 0) +
      (e.imageUrl ? 10 : 0) +
      (e.contactInfo ? 8 : 0) +
      (e.modelQaScore ?? 0);
    const [primary, secondary] = score(a) >= score(b) ? [a, b] : [b, a];
    return {
      ...primary,
      description: primary.description || secondary.description,
      summary: primary.summary || secondary.summary,
      venue: primary.venue || secondary.venue,
      organizer: primary.organizer || secondary.organizer,
      registrationLink: primary.registrationLink || secondary.registrationLink,
      imageUrl: primary.imageUrl || secondary.imageUrl,
      detailUrl: primary.detailUrl || secondary.detailUrl,
      contactInfo: primary.contactInfo || secondary.contactInfo,
      rawDateText: primary.rawDateText || secondary.rawDateText,
      rawTimeText: primary.rawTimeText || secondary.rawTimeText,
      startDate: primary.startDate || secondary.startDate,
      endDate: primary.endDate || secondary.endDate,
      tags: (primary.tags?.length ?? 0) >= (secondary.tags?.length ?? 0) ? primary.tags : secondary.tags,
      modelQaScore:
        (primary.modelQaScore ?? -1) >= (secondary.modelQaScore ?? -1)
          ? primary.modelQaScore
          : secondary.modelQaScore,
    };
  }

  private dedupeParserCandidates(items: EventCandidate[]): EventCandidate[] {
    const map = new Map<string, EventCandidate>();
    for (const c of items) {
      const key = `${this.normalizeForDedupeKeyPart(c.title)}|${(c.detailUrl || '').split('?')[0].toLowerCase()}|${(c.rawDateText || '').slice(0, 48)}`;
      const prev = map.get(key);
      if (!prev || c.rawBlockText.length > prev.rawBlockText.length) map.set(key, c);
    }
    return [...map.values()];
  }

  /**
   * Skip GPT for crawled pages whose cleaned text hash matches the last successful sync.
   * Disable with UNIVERSITY_INCREMENTAL_PAGE_HASH=0.
   */
  private async filterPagesForIncrementalGpt(
    sourceId: string,
    pages: ScrapedPage[],
    pageMeta: Array<{ pageUrl: string; urlHash: string; contentHash: string }>,
  ): Promise<{ forGpt: ScrapedPage[]; skippedPages: number }> {
    if (this.config.get('UNIVERSITY_INCREMENTAL_PAGE_HASH') === '0' || pages.length === 0) {
      return { forGpt: pages, skippedPages: 0 };
    }
    const urlHashes = pageMeta.map((m) => m.urlHash);
    const existing = await this.crawlHashDb().findMany({
      where: { sourceId, urlHash: { in: urlHashes } },
    });
    const prev = new Map(existing.map((e) => [e.urlHash, e.contentHash]));
    const forGpt: ScrapedPage[] = [];
    let skipped = 0;
    for (let i = 0; i < pages.length; i++) {
      const uh = pageMeta[i].urlHash;
      const ch = pageMeta[i].contentHash;
      if (prev.get(uh) === ch) {
        skipped++;
        continue;
      }
      forGpt.push(pages[i]);
    }
    if (forGpt.length === 0 && pages.length > 0) {
      this.logger.log(
        `Incremental crawl: all ${pages.length} page(s) match previous contentHash — skipping GPT for this source`,
      );
    }
    return { forGpt, skippedPages: skipped };
  }

  private async persistPageContentHashes(
    sourceId: string,
    pageMeta: Array<{ pageUrl: string; urlHash: string; contentHash: string }>,
  ): Promise<void> {
    if (pageMeta.length === 0) return;
    const BATCH = 25;
    for (let i = 0; i < pageMeta.length; i += BATCH) {
      const slice = pageMeta.slice(i, i + BATCH);
      await this.prisma.$transaction(async (tx) => {
        const h = (tx as unknown as { universityCrawlPageHash: { upsert: (a: object) => Promise<unknown> } })
          .universityCrawlPageHash;
        for (const row of slice) {
          await h.upsert({
            where: { sourceId_urlHash: { sourceId, urlHash: row.urlHash } },
            create: {
              sourceId,
              urlHash: row.urlHash,
              pageUrl: row.pageUrl.slice(0, 2048),
              contentHash: row.contentHash,
            },
            update: {
              contentHash: row.contentHash,
              pageUrl: row.pageUrl.slice(0, 2048),
            },
          });
        }
      });
    }
  }

  private crawlHashDb(): {
    findMany: (args: {
      where: { sourceId: string; urlHash: { in: string[] } };
    }) => Promise<Array<{ urlHash: string; contentHash: string }>>;
  } {
    const d = (this.prisma as unknown as Record<string, unknown>)['universityCrawlPageHash'];
    if (!d || typeof d !== 'object') {
      throw new Error('Prisma client missing universityCrawlPageHash — run `npx prisma generate`');
    }
    return d as {
      findMany: (args: {
        where: { sourceId: string; urlHash: { in: string[] } };
      }) => Promise<Array<{ urlHash: string; contentHash: string }>>;
    };
  }

  private buildGptChunks(
    pages: ScrapedPage[],
    maxChunkChars: number,
    maxPageTextChars: number,
  ): Array<{ text: string; images: string[]; links: string[] }> {
    const chunks: Array<{ text: string; images: string[]; links: string[] }> = [];
    let buf = '';
    const imgs: string[] = [];
    const lnks: string[] = [];

    const flush = () => {
      const t = buf.trim();
      if (!t) {
        buf = '';
        imgs.length = 0;
        lnks.length = 0;
        return;
      }
      chunks.push({
        text: t,
        images: [...new Set(imgs)].slice(0, 40),
        links: [...new Set(lnks)].slice(0, 60),
      });
      buf = '';
      imgs.length = 0;
      lnks.length = 0;
    };

    for (const p of pages) {
      const condensed = condenseListingTextForGpt(p.cleanedText, maxPageTextChars);
      const header = `\n\n=== PAGE: ${p.url} ===\n`;
      const block = `${header}${condensed}\n`;

      if (block.length > maxChunkChars) {
        flush();
        for (let i = 0; i < condensed.length; i += maxChunkChars - header.length) {
          const slice = condensed.slice(i, i + (maxChunkChars - header.length));
          chunks.push({
            text: `${header}${slice}`,
            images: [...p.candidateImages].slice(0, 40),
            links: [...p.detailLinks].slice(0, 60),
          });
        }
        continue;
      }

      if (buf.length + block.length > maxChunkChars && buf.length > 0) {
        flush();
      }
      buf += block;
      imgs.push(...p.candidateImages);
      lnks.push(...p.detailLinks);
    }
    flush();

    return chunks.length > 0 ? chunks : [{ text: '(no page text)', images: [], links: [] }];
  }

  private async runWithConcurrency<T>(tasks: Array<() => Promise<T>>, maxParallel = 1): Promise<T[]> {
    const results: T[] = [];
    let cursor = 0;
    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(Math.max(1, maxParallel), tasks.length); i++) {
      workers.push(
        (async () => {
          while (cursor < tasks.length) {
            const idx = cursor++;
            try {
              results[idx] = await tasks[idx]();
            } catch (e) {
              this.logger.error(`Sync task failed: ${(e as Error).message}`);
            }
          }
        })(),
      );
    }
    await Promise.all(workers);
    return results;
  }
}
