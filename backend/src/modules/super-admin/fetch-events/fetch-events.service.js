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
exports.FetchEventsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const csv_parser_1 = require("./services/csv.parser");
const university_events_timezone_service_1 = require("./services/university-events-timezone.service");
const xlsx_parser_1 = require("./services/xlsx.parser");
let FetchEventsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var FetchEventsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FetchEventsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        sync;
        syncJobs;
        config;
        universityTz;
        constructor(prisma, sync, syncJobs, config, universityTz) {
            this.prisma = prisma;
            this.sync = sync;
            this.syncJobs = syncJobs;
            this.config = config;
            this.universityTz = universityTz;
        }
        // ---------- SOURCES ----------
        async ingestCsv(buffer, fileName) {
            if (!buffer || buffer.length === 0) {
                throw new common_1.BadRequestException('Empty file');
            }
            const rows = this.parseUniversitySpreadsheetBuffer(buffer, fileName);
            if (rows.length === 0) {
                throw new common_1.BadRequestException('No valid rows with http(s) URLs. Expected columns such as "University Name" + "Website URL", or an "Events URL" / "Calendar URL" column when available.');
            }
            const batchId = (0, crypto_1.randomUUID)();
            const safeName = (fileName || 'upload.csv').slice(0, 500);
            const uploadedAt = new Date();
            const result = await this.ingestRows(rows, { batchId, fileName: safeName, uploadedAt });
            let syncJobId;
            if (this.config.get('UNIVERSITY_SYNC_JOBS_DISABLED') !== '1' &&
                this.config.get('UNIVERSITY_SYNC_AUTO_QUEUE') !== '0' &&
                result.sourceIds.length > 0) {
                syncJobId = await this.syncJobs.enqueueBatch(batchId, result.sourceIds);
            }
            return { ...result, batchId, syncJobId };
        }
        async addUrlSource(universityName, url) {
            const cleanUrl = url?.trim();
            if (!cleanUrl || !/^https?:\/\//i.test(cleanUrl)) {
                throw new common_1.BadRequestException('A valid http(s) URL is required');
            }
            const name = (universityName || '').trim() || this.hostnameFromUrl(cleanUrl);
            const { sourceIds } = await this.ingestRows([{ universityName: name, url: cleanUrl }], null);
            return { sourceId: sourceIds[0] };
        }
        async ingestRows(rows, batch) {
            let created = 0;
            let skipped = 0;
            const sourceIds = [];
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
                    if (isNew)
                        created++;
                    else
                        skipped++;
                    sourceIds.push(upserted.id);
                }
                catch (e) {
                    if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                        skipped++;
                    }
                    else {
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
            const grouped = new Map();
            for (const s of sources) {
                if (!s.csvBatchId)
                    continue;
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
                if (s.status === 'pending')
                    existing.pending += 1;
                else if (s.status === 'syncing')
                    existing.syncing += 1;
                else if (s.status === 'completed')
                    existing.completed += 1;
                else if (s.status === 'failed')
                    existing.failed += 1;
                if (!existing.uploadedAt && s.csvUploadedAt)
                    existing.uploadedAt = s.csvUploadedAt;
                grouped.set(s.csvBatchId, existing);
            }
            return Array.from(grouped.values()).sort((a, b) => {
                const ta = a.uploadedAt ? a.uploadedAt.getTime() : 0;
                const tb = b.uploadedAt ? b.uploadedAt.getTime() : 0;
                return tb - ta;
            });
        }
        async syncBatch(batchId) {
            const sources = await this.prisma.universitySource.findMany({
                where: { csvBatchId: batchId, isActive: true },
                select: { id: true },
            });
            if (sources.length === 0) {
                throw new common_1.NotFoundException('No sources found for this batch');
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
        async deleteBatch(batchId) {
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
                feedKind: 'legacy',
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
                logoUrl: s.logoUrl?.trim() || this.deriveLogoUrl(s.websiteUrl),
                totalEvents: s._count.events,
                lastSyncedAt: s.lastSyncedAt,
                feedKind: 'scraped',
            }));
            const merged = [...legacy, ...scraped];
            merged.sort((a, b) => a.universityName.localeCompare(b.universityName, undefined, { sensitivity: 'base' }));
            return merged;
        }
        async getPublicUniversity(id) {
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
                    feedKind: 'legacy',
                };
            }
            const scraped = await this.prisma.scrapedEventSource.findFirst({
                where: { id, active: true },
            });
            if (scraped) {
                const win = this.universityTz.getCurrentCalendarMonthWindow();
                const totalEvents = await this.prisma.scrapedEventRecord.count({
                    where: { sourceId: id, ...(0, university_events_timezone_service_1.prismaMonthOverlapWhereInput)(win) },
                });
                return {
                    id: scraped.id,
                    universityName: scraped.name,
                    url: scraped.websiteUrl,
                    logoUrl: scraped.logoUrl?.trim() || this.deriveLogoUrl(scraped.websiteUrl),
                    totalEvents,
                    lastSyncedAt: scraped.lastSyncedAt,
                    ingestionWindowUtc: this.buildIngestionWindowUtc(),
                    feedKind: 'scraped',
                };
            }
            throw new common_1.NotFoundException('University not found');
        }
        /**
         * Same rules as university sync: **current calendar month** in UNIVERSITY_EVENTS_TIMEZONE.
         * Exposed for public UI (calendar bounds, copy). `horizonDays` = number of days in that month.
         */
        buildIngestionWindowUtc(now = new Date()) {
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
        /** Public "All" tab: current calendar month, including ranges that start before or end after the month. */
        usesCurrentMonthListScope(params) {
            return !params.upcoming && !params.latest && !params.trending && !params.onDateUtc?.trim();
        }
        appendCurrentMonthOverlapFilter(andParts, params) {
            if (!this.usesCurrentMonthListScope(params))
                return;
            const win = this.universityTz.getCurrentCalendarMonthWindow();
            andParts.push((0, university_events_timezone_service_1.prismaMonthOverlapWhereInput)(win));
        }
        mapMultiMonthSpan(startDate, endDate, win) {
            if (!startDate)
                return false;
            return (0, university_events_timezone_service_1.universityEventSpansOutsideIngestionMonth)(startDate, endDate, win);
        }
        scrapedOccurrenceDates(json) {
            if (!json)
                return { dates: [], displayYmd: null };
            if (Array.isArray(json)) {
                const dates = json.filter((x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x));
                return { dates, displayYmd: dates[0] ?? null };
            }
            if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
                const o = json;
                const dates = Array.isArray(o.dates)
                    ? o.dates.filter((x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x))
                    : [];
                const displayYmd = typeof o.displayYmd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.displayYmd)
                    ? o.displayYmd
                    : dates[0] ?? null;
                return { dates, displayYmd };
            }
            return { dates: [], displayYmd: null };
        }
        async syncOne(sourceId) {
            const exists = await this.prisma.universitySource.findUnique({ where: { id: sourceId } });
            if (!exists)
                throw new common_1.NotFoundException('Source not found');
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
        async listSyncJobs(limit) {
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
        async getSyncJob(jobId) {
            const j = await this.syncJobs.getJob(jobId);
            if (!j)
                throw new common_1.NotFoundException('Job not found');
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
                durationMs: r.completedAt && r.startedAt
                    ? r.completedAt.getTime() - r.startedAt.getTime()
                    : null,
            }));
        }
        async deleteSource(sourceId) {
            const exists = await this.prisma.universitySource.findUnique({ where: { id: sourceId } });
            if (!exists)
                throw new common_1.NotFoundException('Source not found');
            await this.prisma.universitySource.delete({ where: { id: sourceId } });
            return { ok: true };
        }
        async toggleSourceActive(sourceId, isActive) {
            return this.prisma.universitySource.update({
                where: { id: sourceId },
                data: { isActive },
            });
        }
        // ---------- EVENTS ----------
        async listEvents(params) {
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
        async listUniversityEvents(params) {
            const page = Math.max(1, params.page || 1);
            const pageSize = Math.min(100, Math.max(1, params.pageSize || 24));
            const andParts = [{ status: 'active' }];
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
            this.appendCurrentMonthOverlapFilter(andParts, params);
            const where = andParts.length === 1 ? andParts[0] : { AND: andParts };
            const listWin = this.universityTz.getCurrentCalendarMonthWindow(now);
            const orderBy = (() => {
                const order = params.order === 'desc' ? 'desc' : 'asc';
                if (params.latest)
                    return { firstSeenAt: 'desc' };
                if (params.trending)
                    return [{ firstSeenAt: 'desc' }, { startDate: 'asc' }];
                switch (params.sort) {
                    case 'title':
                        return { title: order };
                    case 'firstSeenAt':
                        return { firstSeenAt: order };
                    default:
                        return { startDate: order };
                }
            })();
            const categoryWhere = { ...where };
            const includeSource = {
                source: { select: { id: true, universityName: true, url: true } },
            };
            const singleSourceId = params.sourceId?.trim();
            /** GPT/crawl often produced multiple rows for the same real-world event; collapse for public UI. */
            const DEDUPE_FETCH_CAP = 1200;
            let total;
            let items;
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
            }
            else {
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
                    multiMonthSpan: this.mapMultiMonthSpan(e.startDate, e.endDate, listWin),
                    occurrenceDates: [],
                    occurrenceDisplayYmd: null,
                    multipleOccurrencesInMonth: false,
                    source: e.source,
                })),
                categories: categoryAgg
                    .filter((c) => c.category)
                    .map((c) => ({ name: c.category, count: c._count._all })),
            };
        }
        /** Public listing for {@link ScrapedEventRecord} (URL scrape / Localist feeds). */
        async listScrapedSourceEvents(params) {
            const page = Math.max(1, params.page || 1);
            const pageSize = Math.min(100, Math.max(1, params.pageSize || 24));
            const sourceId = params.sourceId.trim();
            const srcRow = await this.prisma.scrapedEventSource.findUnique({
                where: { id: sourceId },
            });
            if (!srcRow?.active) {
                return { total: 0, page, pageSize, items: [], categories: [] };
            }
            const andParts = [{ sourceId }];
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
            this.appendCurrentMonthOverlapFilter(andParts, params);
            const where = andParts.length === 1 ? andParts[0] : { AND: andParts };
            const listWin = this.universityTz.getCurrentCalendarMonthWindow(now);
            const orderBy = (() => {
                const order = params.order === 'desc' ? 'desc' : 'asc';
                if (params.latest)
                    return { syncedAt: 'desc' };
                if (params.trending)
                    return [{ syncedAt: 'desc' }, { startDate: 'asc' }];
                switch (params.sort) {
                    case 'title':
                        return { title: order };
                    case 'firstSeenAt':
                        return { createdAt: order };
                    default:
                        return { startDate: order };
                }
            })();
            const categoryWhere = { ...where };
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
                    multiMonthSpan: this.mapMultiMonthSpan(e.startDate, e.endDate, listWin),
                    occurrenceDates: this.scrapedOccurrenceDates(e.occurrenceDatesJson).dates,
                    occurrenceDisplayYmd: this.scrapedOccurrenceDates(e.occurrenceDatesJson).displayYmd,
                    multipleOccurrencesInMonth: this.scrapedOccurrenceDates(e.occurrenceDatesJson).dates.length > 1,
                    source: sourcePayload,
                })),
                categories: categoryAgg
                    .filter((c) => c.category)
                    .map((c) => ({ name: c.category, count: c._count._all })),
            };
        }
        async deleteEvent(eventId) {
            await this.prisma.universityEvent.delete({ where: { id: eventId } }).catch(() => null);
            return { ok: true };
        }
        // ---------- helpers ----------
        /**
         * CSV text or Excel (.xlsx / legacy .xls via SheetJS). ZIP magic-bytes used when extension is wrong.
         */
        parseUniversitySpreadsheetBuffer(buffer, fileName) {
            const lower = (fileName || '').toLowerCase();
            const pkZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
            const forceExcel = lower.endsWith('.xlsx') || lower.endsWith('.xls');
            if (forceExcel || pkZip) {
                try {
                    const matrix = (0, xlsx_parser_1.parseXlsxToMatrix)(buffer);
                    const parsed = (0, csv_parser_1.parseUniversityMatrix)(matrix);
                    if (parsed.length > 0 || forceExcel) {
                        return parsed;
                    }
                }
                catch (e) {
                    if (forceExcel) {
                        throw new common_1.BadRequestException(`Could not read spreadsheet: ${e.message}`);
                    }
                }
            }
            return (0, csv_parser_1.parseUniversityCsv)(buffer.toString('utf-8'));
        }
        hostnameFromUrl(url) {
            try {
                return new URL(url).hostname.replace(/^www\./, '');
            }
            catch {
                return url;
            }
        }
        /** Google's S2 favicon service — works for any public domain with no config. */
        deriveLogoUrl(url) {
            const host = this.hostnameFromUrl(url);
            return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
        }
        /** `contactInfo` exists on DB rows; Prisma `GetPayload` types can lag until `prisma generate`. */
        eventRowContactInfo(row) {
            if (!row || typeof row !== 'object')
                return null;
            const c = row.contactInfo;
            return c ?? null;
        }
        eventRowExtractionConfidence(row) {
            if (!row || typeof row !== 'object')
                return null;
            const c = row.extractionConfidence;
            return typeof c === 'number' && Number.isFinite(c) ? c : null;
        }
        safeParseJsonArray(s) {
            if (!s)
                return [];
            try {
                const v = JSON.parse(s);
                return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
            }
            catch {
                return [];
            }
        }
        /** Scraped rows store tags as comma-separated text; university rows use JSON array strings. */
        tagsFromScrapedStorage(s) {
            if (!s)
                return [];
            const trimmed = s.trim();
            if (trimmed.startsWith('[')) {
                try {
                    const v = JSON.parse(trimmed);
                    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
                }
                catch {
                    /* fall through */
                }
            }
            return trimmed
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
        }
        /** Matches sync.service dedupe normalization so list API hides duplicate GPT rows. */
        normalizeFingerprintPart(s) {
            const raw = (s || '').normalize('NFKD').replace(/\p{M}/gu, '');
            return raw
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 160);
        }
        eventFingerprint(e) {
            const title = this.normalizeFingerprintPart(e.title);
            const date = e.startDate != null
                ? e.startDate.toISOString().slice(0, 10)
                : this.normalizeFingerprintPart(e.rawDateText || '').slice(0, 96);
            return `${title}|${date}`;
        }
        dedupeUniversityEventsByFingerprint(rows) {
            const seen = new Set();
            const out = [];
            for (const row of rows) {
                const k = this.eventFingerprint(row);
                if (seen.has(k))
                    continue;
                seen.add(k);
                out.push(row);
            }
            return out;
        }
    };
    return FetchEventsService = _classThis;
})();
exports.FetchEventsService = FetchEventsService;
//# sourceMappingURL=fetch-events.service.js.map