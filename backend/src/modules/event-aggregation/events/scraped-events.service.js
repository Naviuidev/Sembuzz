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
exports.ScrapedEventsService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
let ScrapedEventsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ScrapedEventsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScrapedEventsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        config;
        constructor(prisma, config) {
            this.prisma = prisma;
            this.config = config;
        }
        tz() {
            return (this.config.get('EVENT_SYNC_TIMEZONE')?.trim() ||
                this.config.get('UNIVERSITY_EVENTS_TIMEZONE')?.trim() ||
                'America/New_York');
        }
        async list(params) {
            const page = Math.max(1, params.page ?? 1);
            const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
            const where = {};
            if (params.category?.trim())
                where.category = params.category.trim();
            if (params.sourceId?.trim())
                where.sourceId = params.sourceId.trim();
            const sortField = params.sort === 'title' ? 'title' : params.sort === 'createdAt' ? 'createdAt' : 'startDate';
            const order = params.order === 'desc' ? 'desc' : 'asc';
            const [total, items] = await Promise.all([
                this.prisma.scrapedEventRecord.count({ where }),
                this.prisma.scrapedEventRecord.findMany({
                    where,
                    orderBy: { [sortField]: order },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: { source: { select: { id: true, name: true, websiteUrl: true } } },
                }),
            ]);
            return { total, page, pageSize, items };
        }
        async upcoming(params) {
            const now = new Date();
            const startOfToday = luxon_1.DateTime.fromJSDate(now, { zone: 'utc' })
                .setZone(this.tz())
                .startOf('day')
                .toUTC()
                .toJSDate();
            const page = Math.max(1, params.page ?? 1);
            const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
            const where = {
                startDate: { gte: startOfToday },
            };
            const [total, items] = await Promise.all([
                this.prisma.scrapedEventRecord.count({ where }),
                this.prisma.scrapedEventRecord.findMany({
                    where,
                    orderBy: { startDate: 'asc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: { source: { select: { id: true, name: true, websiteUrl: true } } },
                }),
            ]);
            return { total, page, pageSize, items };
        }
        async byMonth(year, month, params) {
            if (month < 1 || month > 12)
                throw new common_1.BadRequestException('month must be 1–12');
            const z = this.tz();
            const start = luxon_1.DateTime.fromObject({ year, month, day: 1 }, { zone: z }).startOf('month');
            if (!start.isValid)
                throw new common_1.BadRequestException('invalid year/month');
            const endEx = start.plus({ months: 1 });
            const page = Math.max(1, params.page ?? 1);
            const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
            const where = {
                AND: [
                    { startDate: { gte: start.toUTC().toJSDate() } },
                    { startDate: { lt: endEx.toUTC().toJSDate() } },
                ],
            };
            const [total, items] = await Promise.all([
                this.prisma.scrapedEventRecord.count({ where }),
                this.prisma.scrapedEventRecord.findMany({
                    where,
                    orderBy: { startDate: 'asc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    include: { source: { select: { id: true, name: true, websiteUrl: true } } },
                }),
            ]);
            return { total, page, pageSize, year, month, items };
        }
        async getById(id) {
            const row = await this.prisma.scrapedEventRecord.findUnique({
                where: { id },
                include: { source: { select: { id: true, name: true, websiteUrl: true } } },
            });
            if (!row)
                throw new common_1.NotFoundException('Event not found');
            return row;
        }
    };
    return ScrapedEventsService = _classThis;
})();
exports.ScrapedEventsService = ScrapedEventsService;
//# sourceMappingURL=scraped-events.service.js.map