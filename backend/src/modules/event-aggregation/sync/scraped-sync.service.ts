import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  universityEventRangeOverlapsWindow,
  UniversityEventsTimezoneService,
} from '../../super-admin/fetch-events/services/university-events-timezone.service';
import type { RawNormalizedEventDraft } from '../scrapers/base-scraper.abstract';
import type { GenericSelectorConfig } from '../scrapers/selector-config.types';
import { ScrapedHtmlLoaderService } from '../scrapers/scraped-html-loader.service';
import { discoverEventCalendarUrl } from '../scrapers/discover-calendar-url.util';
import { enrichLocalistRecurringDrafts } from '../scrapers/localist-recurring-enrichment';
import {
  buildDedupeKey,
  buildSlug,
  GenericSelectorScraper,
} from '../scrapers/providers/generic.scraper';

function selectorsFromJson(json: Prisma.JsonValue | null): GenericSelectorConfig {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return {};
  return json as GenericSelectorConfig;
}

@Injectable()
export class ScrapedSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly htmlLoader: ScrapedHtmlLoaderService,
    private readonly universityTz: UniversityEventsTimezoneService,
  ) {}

  private dateZone(): string {
    return (
      this.config.get<string>('EVENT_SYNC_TIMEZONE')?.trim() ||
      this.config.get<string>('UNIVERSITY_EVENTS_TIMEZONE')?.trim() ||
      'America/New_York'
    );
  }

  /** Same policy as legacy university sync: current calendar month in configured TZ. */
  private filterDraftsByIngestionMonth(drafts: RawNormalizedEventDraft[]) {
    const win = this.universityTz.getCurrentCalendarMonthWindow();
    const inMonth: RawNormalizedEventDraft[] = [];
    let skippedNoDate = 0;
    let skippedOutsideMonth = 0;

    for (const draft of drafts) {
      if (!draft.startDate) {
        skippedNoDate += 1;
        continue;
      }
      if (!universityEventRangeOverlapsWindow(draft.startDate, draft.endDate, win)) {
        skippedOutsideMonth += 1;
        continue;
      }
      inMonth.push(draft);
    }

    return { inMonth, skippedNoDate, skippedOutsideMonth, ingestionWindow: win };
  }

  private buildSyncDetailsJson(params: {
    src: { id: string; name: string; websiteUrl: string };
    durationMs: number;
    htmlLengthChars: number;
    usedPlaywright: boolean;
    extractionMode: 'generic' | 'localist' | 'uwm' | 'none';
    parsedFromPage: number;
    inMonthCount: number;
    skippedNoDate: number;
    skippedOutsideMonth: number;
    upsertedCount: number;
    draftsForSamples: RawNormalizedEventDraft[];
    hardError: string | null;
    softHint: string | null;
    timezone: string;
    urlActuallyFetched: string;
    calendarUrlDiscovered?: string | null;
    ingestionWindow: ReturnType<UniversityEventsTimezoneService['getCurrentCalendarMonthWindow']>;
  }): Prisma.InputJsonValue {
    const z = params.timezone;
    const drafts = params.draftsForSamples;
    const withStart = drafts.filter((d) => d.startDate != null);
    const times = withStart.map((d) => (d.startDate as Date).getTime());
    const minUtc = times.length ? new Date(Math.min(...times)).toISOString() : null;
    const maxUtc = times.length ? new Date(Math.max(...times)).toISOString() : null;

    const monthSet = new Set<string>();
    for (const d of withStart) {
      monthSet.add(
        DateTime.fromJSDate(d.startDate as Date, { zone: 'utc' }).setZone(z).toFormat('yyyy-MM'),
      );
    }

    const sortedSamples = [...drafts].sort((a, b) => {
      const ta = a.startDate?.getTime() ?? 0;
      const tb = b.startDate?.getTime() ?? 0;
      return ta - tb;
    });

    return {
      version: 1,
      purpose: 'qa_and_debug',
      sourceId: params.src.id,
      sourceName: params.src.name,
      sourceUrlSaved: params.src.websiteUrl,
      sourceUrlFetched: params.urlActuallyFetched,
      calendarUrlDiscovered: params.calendarUrlDiscovered ?? undefined,
      ingestionMonthWindow: {
        timeZone: params.ingestionWindow.timeZone,
        firstDayInclusive: params.ingestionWindow.firstDayInclusive,
        lastDayInclusive: params.ingestionWindow.lastDayInclusive,
        horizonDays: params.ingestionWindow.horizonDays,
      },
      run: {
        durationMs: params.durationMs,
        htmlLengthChars: params.htmlLengthChars,
        fetchedWithPlaywright: params.usedPlaywright,
        extractionMode: params.extractionMode,
        timezoneUsedForMonthBuckets: z,
      },
      counts: {
        parsedFromPage: params.parsedFromPage,
        inCurrentMonthWindow: params.inMonthCount,
        skippedNoStartDate: params.skippedNoDate,
        skippedOutsideMonthWindow: params.skippedOutsideMonth,
        upsertedToDatabase: params.upsertedCount,
      },
      startDateRangeUtc: { min: minUtc, max: maxUtc },
      monthsCoveredInSyncTimezone: [...monthSet].sort(),
      sampleEvents: sortedSamples.slice(0, 10).map((d) => ({
        title: d.title,
        startDateUtc: d.startDate?.toISOString() ?? null,
        endDateUtc: d.endDate?.toISOString() ?? null,
        startMonthInTimezone: d.startDate
          ? DateTime.fromJSDate(d.startDate, { zone: 'utc' }).setZone(z).toFormat('yyyy-MM')
          : null,
        venue: d.venue ?? null,
        sourceUrl: d.sourceUrl ?? null,
      })),
      validationHints: {
        note:
          'Only events overlapping the current calendar month (same rule as /public/universities) are saved. Enable UNIVERSITY_PLAYWRIGHT=1 for Load more / JS calendars.',
      },
      outcome: {
        failed: Boolean(params.hardError),
        errorMessage: params.hardError ?? undefined,
        hintMessage: !params.hardError && params.softHint ? params.softHint : undefined,
      },
    };
  }

  private async extractFromHtml(html: string, selectors: GenericSelectorConfig) {
    const scraper = new GenericSelectorScraper();
    scraper.setDateZone(this.dateZone());
    return scraper.extractEvents(html, selectors);
  }

  async triggerSync(sourceId: string) {
    const src = await this.prisma.scrapedEventSource.findUnique({ where: { id: sourceId } });
    if (!src) throw new NotFoundException('Source not found');

    const log = await this.prisma.scrapedSyncLog.create({
      data: { sourceId, status: 'running', totalEvents: 0 },
    });

    const t0 = Date.now();
    let hardError: string | null = null;
    let softHint: string | null = null;
    let upsertedCount = 0;
    let htmlLengthChars = 0;
    let usedPlaywright = false;
    let extractionMode: 'generic' | 'localist' | 'uwm' | 'none' = 'none';
    let parsedFromPage = 0;
    let inMonthCount = 0;
    let skippedNoDate = 0;
    let skippedOutsideMonth = 0;
    let draftsForSamples: RawNormalizedEventDraft[] = [];
    let fetchUrl = src.websiteUrl.trim();
    let calendarUrlDiscovered: string | null = null;
    const selectors = selectorsFromJson(src.selectorsJson);
    const ingestionWindow = this.universityTz.getCurrentCalendarMonthWindow();

    try {
      let loaded = await this.htmlLoader.loadWithMeta(fetchUrl);
      htmlLengthChars = loaded.html.length;
      usedPlaywright = loaded.usedPlaywright;

      let result = await this.extractFromHtml(loaded.html, selectors);
      extractionMode = result.extractionMode;
      parsedFromPage = result.drafts.length;

      if (!result.drafts.length && extractionMode === 'none') {
        const discovered = discoverEventCalendarUrl(loaded.html, fetchUrl);
        if (discovered) {
          calendarUrlDiscovered = discovered;
          fetchUrl = discovered;
          loaded = await this.htmlLoader.loadWithMeta(fetchUrl);
          htmlLengthChars = loaded.html.length;
          usedPlaywright = loaded.usedPlaywright;
          result = await this.extractFromHtml(loaded.html, selectors);
          extractionMode = result.extractionMode;
          parsedFromPage = result.drafts.length;
        }
      }

      // Retry with Playwright when page looks JS-paginated and first pass found nothing
      if (!result.drafts.length && !usedPlaywright && this.htmlLoader.needsPlaywrightRetry(loaded.html)) {
        const retry = await this.htmlLoader.loadWithMeta(fetchUrl);
        if (retry.usedPlaywright) {
          usedPlaywright = true;
          htmlLengthChars = retry.html.length;
          result = await this.extractFromHtml(retry.html, selectors);
          extractionMode = result.extractionMode;
          parsedFromPage = result.drafts.length;
        }
      }

      if (extractionMode === 'localist' && result.drafts.length > 0) {
        await enrichLocalistRecurringDrafts(result.drafts, ingestionWindow, this.dateZone());
      }

      const filtered = this.filterDraftsByIngestionMonth(result.drafts);
      inMonthCount = filtered.inMonth.length;
      skippedNoDate = filtered.skippedNoDate;
      skippedOutsideMonth = filtered.skippedOutsideMonth;
      draftsForSamples = filtered.inMonth;

      if (!parsedFromPage) {
        softHint =
          `No events extracted from ${fetchUrl}. Auto-detects Localist, UWM-style calendars, and JSON-LD. ` +
          `For JS "Load more" pages set UNIVERSITY_PLAYWRIGHT=1.`;
      } else if (!inMonthCount) {
        softHint =
          `Parsed ${parsedFromPage} event(s) but none overlap ${ingestionWindow.firstDayInclusive}–${ingestionWindow.lastDayInclusive} (${ingestionWindow.timeZone}).`;
      }

      const now = new Date();
      for (const draft of filtered.inMonth) {
        const dedupeKey = buildDedupeKey(src.id, draft);
        const slug = buildSlug(draft, dedupeKey);
        await this.prisma.scrapedEventRecord.upsert({
          where: { sourceId_dedupeKey: { sourceId: src.id, dedupeKey } },
          create: {
            sourceId: src.id,
            title: draft.title.slice(0, 500),
            slug,
            dedupeKey,
            description: draft.description ?? null,
            image: draft.image ? draft.image.slice(0, 2048) : null,
            startDate: draft.startDate,
            endDate: draft.endDate ?? null,
            occurrenceDatesJson:
              draft.occurrenceDatesInMonth?.length ?
                ({
                  dates: draft.occurrenceDatesInMonth,
                  displayYmd:
                    draft.listingOccurrenceYmd &&
                    draft.occurrenceDatesInMonth.includes(draft.listingOccurrenceYmd)
                      ? draft.listingOccurrenceYmd
                      : draft.occurrenceDatesInMonth[0],
                } as Prisma.InputJsonValue)
              : undefined,
            venue: draft.venue ? draft.venue.slice(0, 500) : null,
            city: draft.city ? draft.city.slice(0, 200) : null,
            country: draft.country ? draft.country.slice(0, 200) : null,
            sourceUrl: draft.sourceUrl ? draft.sourceUrl.slice(0, 2048) : null,
            sourceWebsite: src.websiteUrl.slice(0, 2048),
            category: draft.category ? draft.category.slice(0, 120) : null,
            organizer: draft.organizer ? draft.organizer.slice(0, 500) : null,
            tags: draft.tags?.length ? draft.tags.join(',').slice(0, 65000) : null,
            syncedAt: now,
          },
          update: {
            title: draft.title.slice(0, 500),
            slug,
            description: draft.description ?? null,
            image: draft.image ? draft.image.slice(0, 2048) : null,
            startDate: draft.startDate,
            endDate: draft.endDate ?? null,
            occurrenceDatesJson:
              draft.occurrenceDatesInMonth?.length ?
                ({
                  dates: draft.occurrenceDatesInMonth,
                  displayYmd:
                    draft.listingOccurrenceYmd &&
                    draft.occurrenceDatesInMonth.includes(draft.listingOccurrenceYmd)
                      ? draft.listingOccurrenceYmd
                      : draft.occurrenceDatesInMonth[0],
                } as Prisma.InputJsonValue)
              : undefined,
            venue: draft.venue ? draft.venue.slice(0, 500) : null,
            city: draft.city ? draft.city.slice(0, 200) : null,
            country: draft.country ? draft.country.slice(0, 200) : null,
            sourceUrl: draft.sourceUrl ? draft.sourceUrl.slice(0, 2048) : null,
            sourceWebsite: src.websiteUrl.slice(0, 2048),
            category: draft.category ? draft.category.slice(0, 120) : null,
            organizer: draft.organizer ? draft.organizer.slice(0, 500) : null,
            tags: draft.tags?.length ? draft.tags.join(',').slice(0, 65000) : null,
            syncedAt: now,
          },
        });
        upsertedCount += 1;
      }
    } catch (e) {
      hardError = (e as Error).message?.slice(0, 8000) ?? String(e);
    }

    const errors = hardError ?? softHint;
    const detailsJson = this.buildSyncDetailsJson({
      src: { id: src.id, name: src.name, websiteUrl: src.websiteUrl },
      durationMs: Date.now() - t0,
      htmlLengthChars,
      usedPlaywright,
      extractionMode,
      parsedFromPage,
      inMonthCount,
      skippedNoDate,
      skippedOutsideMonth,
      upsertedCount,
      draftsForSamples,
      hardError,
      softHint,
      timezone: this.dateZone(),
      urlActuallyFetched: fetchUrl,
      calendarUrlDiscovered,
      ingestionWindow,
    });

    await this.prisma.scrapedSyncLog.update({
      where: { id: log.id },
      data: {
        status: hardError ? 'failed' : 'completed',
        completedAt: new Date(),
        totalEvents: upsertedCount,
        errors,
        detailsJson,
      },
    });

    await this.prisma.scrapedEventSource.update({
      where: { id: sourceId },
      data: { lastSyncedAt: new Date() },
    });

    return { ok: true, logId: log.id, totalEvents: upsertedCount, errors, details: detailsJson };
  }

  async listLogs(sourceId?: string, limit = 50) {
    const take = Math.min(200, Math.max(1, limit));
    return this.prisma.scrapedSyncLog.findMany({
      where: sourceId ? { sourceId } : undefined,
      orderBy: { startedAt: 'desc' },
      take,
      include: { source: { select: { id: true, name: true, websiteUrl: true } } },
    });
  }

  status() {
    const win = this.universityTz.getCurrentCalendarMonthWindow();
    return {
      ok: true,
      worker: 'inline',
      message:
        `Sync: auto-detect Localist/UWM/JSON-LD, optional Playwright (UNIVERSITY_PLAYWRIGHT=1), save events in current month ${win.firstDayInclusive}–${win.lastDayInclusive} (${win.timeZone}).`,
    };
  }
}
