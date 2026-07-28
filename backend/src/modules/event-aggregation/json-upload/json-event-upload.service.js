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
exports.JsonEventUploadService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const json_event_upload_types_1 = require("./json-event-upload.types");
const generic_scraper_1 = require("../scrapers/providers/generic.scraper");
let JsonEventUploadService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var JsonEventUploadService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            JsonEventUploadService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async createFromRawEvents(fileName, rawEvents) {
            if (!rawEvents?.length) {
                throw new common_1.BadRequestException('No events in payload');
            }
            const normalized = [];
            for (const raw of rawEvents) {
                const row = (0, json_event_upload_types_1.normalizeJsonUploadEvent)(raw);
                if (row)
                    normalized.push(row);
            }
            if (!normalized.length) {
                throw new common_1.BadRequestException('No valid events (each needs event_name or title)');
            }
            const upload = await this.prisma.jsonEventUpload.create({
                data: { fileName: fileName.slice(0, 500) },
            });
            const buckets = new Map();
            for (const ev of normalized) {
                const key = (0, json_event_upload_types_1.groupKey)(ev.universityName, ev.calendarUrl);
                const list = buckets.get(key) ?? [];
                list.push(ev);
                buckets.set(key, list);
            }
            const createdGroups = [];
            for (const [, events] of buckets) {
                const first = events[0];
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
                .filter((id) => Boolean(id));
            const liveSources = publishedIds.length > 0
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
        async getGroup(id) {
            const group = await this.prisma.jsonEventUploadGroup.findUnique({
                where: { id },
                include: {
                    upload: { select: { fileName: true, createdAt: true } },
                    events: { orderBy: { sortOrder: 'asc' } },
                },
            });
            if (!group)
                throw new common_1.NotFoundException('Upload group not found');
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
        async deleteGroup(id) {
            const group = await this.prisma.jsonEventUploadGroup.findUnique({ where: { id } });
            if (!group)
                throw new common_1.NotFoundException('Upload group not found');
            const uploadId = group.uploadId;
            if (group.publishedSourceId) {
                try {
                    await this.prisma.scrapedEventSource.delete({
                        where: { id: group.publishedSourceId },
                    });
                }
                catch {
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
        async publishGroup(id) {
            const group = await this.prisma.jsonEventUploadGroup.findUnique({
                where: { id },
                include: { events: { orderBy: { sortOrder: 'asc' } } },
            });
            if (!group)
                throw new common_1.NotFoundException('Upload group not found');
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
                throw new common_1.BadRequestException('No events to publish');
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
            }
            else {
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
                const draft = {
                    title: ev.title,
                    description: ev.description ?? undefined,
                    image: ev.posterUrl ?? group.logoUrl ?? undefined,
                    startDate: ev.startDate,
                    endDate: ev.endDate,
                    venue: ev.venue ?? undefined,
                    sourceUrl: ev.detailUrl ?? undefined,
                };
                const dedupeKey = this.buildJsonDedupeKey(source.id, ev);
                const slug = (0, generic_scraper_1.buildSlug)(draft, dedupeKey);
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
        async isPublishedSourceLive(publishedSourceId) {
            if (!publishedSourceId)
                return false;
            const source = await this.prisma.scrapedEventSource.findUnique({
                where: { id: publishedSourceId },
                select: { id: true, active: true },
            });
            return Boolean(source?.active);
        }
        buildJsonDedupeKey(sourceId, ev) {
            const payload = [
                sourceId,
                ev.detailUrl ?? '',
                ev.title,
                ev.startDate?.toISOString() ?? '',
            ].join('|');
            return (0, crypto_1.createHash)('sha256').update(payload).digest('hex');
        }
        mapGroupRow(g) {
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
        mapEventRow(e, group) {
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
    };
    return JsonEventUploadService = _classThis;
})();
exports.JsonEventUploadService = JsonEventUploadService;
//# sourceMappingURL=json-event-upload.service.js.map