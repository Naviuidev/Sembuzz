"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapedSyncService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const university_events_timezone_service_1 = require("../../super-admin/fetch-events/services/university-events-timezone.service");
const discover_calendar_url_util_1 = require("../scrapers/discover-calendar-url.util");
const localist_recurring_enrichment_1 = require("../scrapers/localist-recurring-enrichment");
const generic_scraper_1 = require("../scrapers/providers/generic.scraper");
function selectorsFromJson(json) {
    if (json === null || typeof json !== 'object' || Array.isArray(json))
        return {};
    return json;
}
let ScrapedSyncService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ScrapedSyncService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScrapedSyncService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        config;
        htmlLoader;
        universityTz;
        constructor(prisma, config, htmlLoader, universityTz) {
            this.prisma = prisma;
            this.config = config;
            this.htmlLoader = htmlLoader;
            this.universityTz = universityTz;
        }
        dateZone() {
            return (this.config.get('EVENT_SYNC_TIMEZONE')?.trim() ||
                this.config.get('UNIVERSITY_EVENTS_TIMEZONE')?.trim() ||
                'America/New_York');
        }
        /** Same policy as legacy university sync: current calendar month in configured TZ. */
        filterDraftsByIngestionMonth(drafts) {
            const win = this.universityTz.getCurrentCalendarMonthWindow();
            const inMonth = [];
            let skippedNoDate = 0;
            let skippedOutsideMonth = 0;
            for (const draft of drafts) {
                if (!draft.startDate) {
                    skippedNoDate += 1;
                    continue;
                }
                if (!(0, university_events_timezone_service_1.universityEventRangeOverlapsWindow)(draft.startDate, draft.endDate, win)) {
                    skippedOutsideMonth += 1;
                    continue;
                }
                inMonth.push(draft);
            }
            return { inMonth, skippedNoDate, skippedOutsideMonth, ingestionWindow: win };
        }
        buildSyncDetailsJson(params) {
            const z = params.timezone;
            const drafts = params.draftsForSamples;
            const withStart = drafts.filter((d) => d.startDate != null);
            const times = withStart.map((d) => d.startDate.getTime());
            const minUtc = times.length ? new Date(Math.min(...times)).toISOString() : null;
            const maxUtc = times.length ? new Date(Math.max(...times)).toISOString() : null;
            const monthSet = new Set();
            for (const d of withStart) {
                monthSet.add(luxon_1.DateTime.fromJSDate(d.startDate, { zone: 'utc' }).setZone(z).toFormat('yyyy-MM'));
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
                        ? luxon_1.DateTime.fromJSDate(d.startDate, { zone: 'utc' }).setZone(z).toFormat('yyyy-MM')
                        : null,
                    venue: d.venue ?? null,
                    sourceUrl: d.sourceUrl ?? null,
                })),
                validationHints: {
                    note: 'Only events overlapping the current calendar month (same rule as /public/universities) are saved. Enable UNIVERSITY_PLAYWRIGHT=1 for Load more / JS calendars.',
                },
                outcome: {
                    failed: Boolean(params.hardError),
                    errorMessage: params.hardError ?? undefined,
                    hintMessage: !params.hardError && params.softHint ? params.softHint : undefined,
                },
            };
        }
        async extractFromHtml(html, selectors) {
            const scraper = new generic_scraper_1.GenericSelectorScraper();
            scraper.setDateZone(this.dateZone());
            return scraper.extractEvents(html, selectors);
        }
        async triggerSync(sourceId) {
            const src = await this.prisma.scrapedEventSource.findUnique({ where: { id: sourceId } });
            if (!src)
                throw new common_1.NotFoundException('Source not found');
            const log = await this.prisma.scrapedSyncLog.create({
                data: { sourceId, status: 'running', totalEvents: 0 },
            });
            const t0 = Date.now();
            let hardError = null;
            let softHint = null;
            let upsertedCount = 0;
            let htmlLengthChars = 0;
            let usedPlaywright = false;
            let extractionMode = 'none';
            let parsedFromPage = 0;
            let inMonthCount = 0;
            let skippedNoDate = 0;
            let skippedOutsideMonth = 0;
            let draftsForSamples = [];
            let fetchUrl = src.websiteUrl.trim();
            let calendarUrlDiscovered = null;
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
                    const discovered = (0, discover_calendar_url_util_1.discoverEventCalendarUrl)(loaded.html, fetchUrl);
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
                    await (0, localist_recurring_enrichment_1.enrichLocalistRecurringDrafts)(result.drafts, ingestionWindow, this.dateZone());
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
                }
                else if (!inMonthCount) {
                    softHint =
                        `Parsed ${parsedFromPage} event(s) but none overlap ${ingestionWindow.firstDayInclusive}–${ingestionWindow.lastDayInclusive} (${ingestionWindow.timeZone}).`;
                }
                const now = new Date();
                for (const draft of filtered.inMonth) {
                    const dedupeKey = (0, generic_scraper_1.buildDedupeKey)(src.id, draft);
                    const slug = (0, generic_scraper_1.buildSlug)(draft, dedupeKey);
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
                            occurrenceDatesJson: draft.occurrenceDatesInMonth?.length ?
                                {
                                    dates: draft.occurrenceDatesInMonth,
                                    displayYmd: draft.listingOccurrenceYmd &&
                                        draft.occurrenceDatesInMonth.includes(draft.listingOccurrenceYmd)
                                        ? draft.listingOccurrenceYmd
                                        : draft.occurrenceDatesInMonth[0],
                                }
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
                            occurrenceDatesJson: draft.occurrenceDatesInMonth?.length ?
                                {
                                    dates: draft.occurrenceDatesInMonth,
                                    displayYmd: draft.listingOccurrenceYmd &&
                                        draft.occurrenceDatesInMonth.includes(draft.listingOccurrenceYmd)
                                        ? draft.listingOccurrenceYmd
                                        : draft.occurrenceDatesInMonth[0],
                                }
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
            }
            catch (e) {
                hardError = e.message?.slice(0, 8000) ?? String(e);
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
        async listLogs(sourceId, limit = 50) {
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
                message: `Sync: auto-detect Localist/UWM/JSON-LD, optional Playwright (UNIVERSITY_PLAYWRIGHT=1), save events in current month ${win.firstDayInclusive}–${win.lastDayInclusive} (${win.timeZone}).`,
            };
        }
    };
    return ScrapedSyncService = _classThis;
})();
exports.ScrapedSyncService = ScrapedSyncService;
//# sourceMappingURL=scraped-sync.service.js.map