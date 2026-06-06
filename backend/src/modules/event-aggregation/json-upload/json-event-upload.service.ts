import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

type JsonUploadGroupWithCount = Prisma.JsonEventUploadGroupGetPayload<{
  include: { _count: { select: { events: true } } };
}>;
import {
  groupKey,
  normalizeJsonUploadEvent,
  type NormalizedJsonUploadEvent,
} from './json-event-upload.types';
import { buildSlug } from '../scrapers/providers/generic.scraper';
import type { RawNormalizedEventDraft } from '../scrapers/base-scraper.abstract';

@Injectable()
export class JsonEventUploadService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromRawEvents(fileName: string, rawEvents: Record<string, unknown>[]) {
    if (!rawEvents?.length) {
      throw new BadRequestException('No events in payload');
    }

    const normalized: NormalizedJsonUploadEvent[] = [];
    for (const raw of rawEvents) {
      const row = normalizeJsonUploadEvent(raw);
      if (row) normalized.push(row);
    }
    if (!normalized.length) {
      throw new BadRequestException('No valid events (each needs event_name or title)');
    }

    const upload = await this.prisma.jsonEventUpload.create({
      data: { fileName: fileName.slice(0, 500) },
    });

    const buckets = new Map<string, NormalizedJsonUploadEvent[]>();
    for (const ev of normalized) {
      const key = groupKey(ev.universityName, ev.calendarUrl);
      const list = buckets.get(key) ?? [];
      list.push(ev);
      buckets.set(key, list);
    }

    const createdGroups: JsonUploadGroupWithCount[] = [];
    for (const [, events] of buckets) {
      const first = events[0]!;
      const group = await this.prisma.jsonEventUploadGroup.create({
        data: {
          uploadId: upload.id,
          universityName: first.universityName.slice(0, 500),
          calendarUrl: first.calendarUrl.slice(0, 2048),
          logoUrl: first.logoUrl?.slice(0, 2048) ?? null,
          events: {
            create: events.map((ev, i) => ({
              title: ev.title.slice(0, 500),
              description: ev.description,
              startDate: ev.startDate,
              endDate: ev.endDate,
              startTime: ev.startTime?.slice(0, 64) ?? null,
              endTime: ev.endTime?.slice(0, 64) ?? null,
              allDay: ev.allDay,
              venue: ev.venue?.slice(0, 500) ?? null,
              detailUrl: ev.detailUrl?.slice(0, 2048) ?? null,
              posterUrl: ev.posterUrl?.slice(0, 2048) ?? null,
              sortOrder: i,
            })),
          },
        },
        include: { _count: { select: { events: true } } },
      });
      createdGroups.push(group);
    }

    return {
      uploadId: upload.id,
      fileName: upload.fileName,
      groupCount: createdGroups.length,
      eventCount: normalized.length,
      groups: createdGroups.map((g) => this.mapGroupRow(g)),
    };
  }

  async listGroups() {
    const groups = await this.prisma.jsonEventUploadGroup.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        upload: { select: { fileName: true, createdAt: true } },
        _count: { select: { events: true } },
      },
    });
    const publishedIds = groups
      .map((g) => g.publishedSourceId)
      .filter((id): id is string => Boolean(id));
    const liveSources =
      publishedIds.length > 0
        ? await this.prisma.scrapedEventSource.findMany({
            where: { id: { in: publishedIds }, active: true },
            select: { id: true },
          })
        : [];
    const liveIds = new Set(liveSources.map((s) => s.id));

    return groups.map((g) => ({
      ...this.mapGroupRow(g),
      fileName: g.upload.fileName,
      uploadedAt: g.upload.createdAt,
      publicLive: g.publishedSourceId ? liveIds.has(g.publishedSourceId) : false,
    }));
  }

  async getGroup(id: string) {
    const group = await this.prisma.jsonEventUploadGroup.findUnique({
      where: { id },
      include: {
        upload: { select: { fileName: true, createdAt: true } },
        events: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!group) throw new NotFoundException('Upload group not found');

    const publicLive = await this.isPublishedSourceLive(group.publishedSourceId);

    return {
      id: group.id,
      universityName: group.universityName,
      calendarUrl: group.calendarUrl,
      logoUrl: group.logoUrl,
      status: group.status,
      publishedSourceId: group.publishedSourceId,
      publishedAt: group.publishedAt,
      publicLive,
      fileName: group.upload.fileName,
      uploadedAt: group.upload.createdAt,
      eventCount: group.events.length,
      events: group.events.map((e) => this.mapEventRow(e, group)),
    };
  }

  async deleteGroup(id: string) {
    const group = await this.prisma.jsonEventUploadGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Upload group not found');

    const uploadId = group.uploadId;

    if (group.publishedSourceId) {
      try {
        await this.prisma.scrapedEventSource.delete({
          where: { id: group.publishedSourceId },
        });
      } catch {
        // Published source may already have been removed manually.
      }
    }

    await this.prisma.jsonEventUploadGroup.delete({ where: { id } });

    const remainingGroups = await this.prisma.jsonEventUploadGroup.count({
      where: { uploadId },
    });
    if (remainingGroups === 0) {
      await this.prisma.jsonEventUpload.delete({ where: { id: uploadId } }).catch(() => undefined);
    }

    return { ok: true };
  }

  async publishGroup(id: string) {
    const group = await this.prisma.jsonEventUploadGroup.findUnique({
      where: { id },
      include: { events: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!group) throw new NotFoundException('Upload group not found');

    const alreadyLive = await this.isPublishedSourceLive(group.publishedSourceId);
    if (group.status === 'published' && group.publishedSourceId && alreadyLive) {
      return {
        ok: true,
        alreadyPublished: true,
        publishedSourceId: group.publishedSourceId,
        publicLive: true,
      };
    }

    if (!group.events.length) {
      throw new BadRequestException('No events to publish');
    }

    let source = await this.prisma.scrapedEventSource.findFirst({
      where: {
        websiteUrl: group.calendarUrl,
        scraperType: 'json_import',
      },
    });

    const now = new Date();
    if (source) {
      source = await this.prisma.scrapedEventSource.update({
        where: { id: source.id },
        data: {
          name: group.universityName.slice(0, 255),
          logoUrl: group.logoUrl,
          active: true,
          lastSyncedAt: now,
        },
      });
    } else {
      source = await this.prisma.scrapedEventSource.create({
        data: {
          name: group.universityName.slice(0, 255),
          websiteUrl: group.calendarUrl.slice(0, 2048),
          scraperType: 'json_import',
          logoUrl: group.logoUrl,
          active: true,
          lastSyncedAt: now,
        },
      });
    }

    for (const ev of group.events) {
      const draft: RawNormalizedEventDraft = {
        title: ev.title,
        description: ev.description ?? undefined,
        image: ev.posterUrl ?? group.logoUrl ?? undefined,
        startDate: ev.startDate,
        endDate: ev.endDate,
        venue: ev.venue ?? undefined,
        sourceUrl: ev.detailUrl ?? undefined,
      };
      const dedupeKey = this.buildJsonDedupeKey(source.id, ev);
      const slug = buildSlug(draft, dedupeKey);
      await this.prisma.scrapedEventRecord.upsert({
        where: { sourceId_dedupeKey: { sourceId: source.id, dedupeKey } },
        create: {
          sourceId: source.id,
          title: ev.title.slice(0, 500),
          slug,
          dedupeKey,
          description: ev.description,
          image: ev.posterUrl?.slice(0, 2048) ?? group.logoUrl?.slice(0, 2048) ?? null,
          startDate: ev.startDate,
          endDate: ev.endDate,
          venue: ev.venue?.slice(0, 500) ?? null,
          sourceUrl: ev.detailUrl?.slice(0, 2048) ?? null,
          sourceWebsite: group.calendarUrl.slice(0, 2048),
          syncedAt: now,
        },
        update: {
          title: ev.title.slice(0, 500),
          slug,
          description: ev.description,
          image: ev.posterUrl?.slice(0, 2048) ?? group.logoUrl?.slice(0, 2048) ?? null,
          startDate: ev.startDate,
          endDate: ev.endDate,
          venue: ev.venue?.slice(0, 500) ?? null,
          sourceUrl: ev.detailUrl?.slice(0, 2048) ?? null,
          syncedAt: now,
        },
      });
    }

    await this.prisma.jsonEventUploadGroup.update({
      where: { id },
      data: {
        status: 'published',
        publishedSourceId: source.id,
        publishedAt: now,
      },
    });

    return {
      ok: true,
      publishedSourceId: source.id,
      eventCount: group.events.length,
      universityName: group.universityName,
      publicLive: true,
      republished: group.status === 'published',
    };
  }

  private async isPublishedSourceLive(publishedSourceId: string | null): Promise<boolean> {
    if (!publishedSourceId) return false;
    const source = await this.prisma.scrapedEventSource.findUnique({
      where: { id: publishedSourceId },
      select: { id: true, active: true },
    });
    return Boolean(source?.active);
  }

  private buildJsonDedupeKey(
    sourceId: string,
    ev: {
      title: string;
      detailUrl: string | null;
      startDate: Date | null;
    },
  ): string {
    const payload = [
      sourceId,
      ev.detailUrl ?? '',
      ev.title,
      ev.startDate?.toISOString() ?? '',
    ].join('|');
    return createHash('sha256').update(payload).digest('hex');
  }

  private mapGroupRow(g: {
    id: string;
    universityName: string;
    calendarUrl: string;
    logoUrl: string | null;
    status: string;
    publishedSourceId: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    _count?: { events: number };
  }) {
    return {
      id: g.id,
      universityName: g.universityName,
      calendarUrl: g.calendarUrl,
      logoUrl: g.logoUrl,
      status: g.status,
      publishedSourceId: g.publishedSourceId,
      publishedAt: g.publishedAt,
      createdAt: g.createdAt,
      eventCount: g._count?.events ?? 0,
    };
  }

  private mapEventRow(
    e: {
      id: string;
      title: string;
      description: string | null;
      startDate: Date | null;
      endDate: Date | null;
      startTime: string | null;
      endTime: string | null;
      allDay: boolean;
      venue: string | null;
      detailUrl: string | null;
      posterUrl: string | null;
    },
    group: { universityName: string; logoUrl: string | null },
  ) {
    return {
      id: e.id,
      title: e.title,
      university: group.universityName,
      description: e.description,
      startDate: e.startDate?.toISOString() ?? null,
      endDate: e.endDate?.toISOString() ?? null,
      startTime: e.startTime,
      endTime: e.endTime,
      allDay: e.allDay,
      venue: e.venue,
      detailUrl: e.detailUrl,
      posterUrl: e.posterUrl,
      logoUrl: e.posterUrl ?? group.logoUrl,
    };
  }
}
