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
exports.ScrapedEventSourcesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let ScrapedEventSourcesService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ScrapedEventSourcesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScrapedEventSourcesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async findAll() {
            const rows = await this.prisma.scrapedEventSource.findMany({
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { events: true } } },
            });
            return rows.map(({ _count, ...rest }) => ({
                ...rest,
                totalEvents: _count.events,
            }));
        }
        async findOne(id) {
            const row = await this.prisma.scrapedEventSource.findUnique({ where: { id } });
            if (!row)
                throw new common_1.NotFoundException('Source not found');
            return row;
        }
        async create(dto) {
            return this.prisma.scrapedEventSource.create({
                data: {
                    name: dto.name,
                    websiteUrl: dto.websiteUrl,
                    scraperType: dto.scraperType?.trim() || 'generic',
                    selectorsJson: dto.selectorsJson === undefined
                        ? client_1.Prisma.JsonNull
                        : dto.selectorsJson,
                    active: dto.active ?? true,
                },
            });
        }
        async update(id, dto) {
            await this.findOne(id);
            const data = {};
            if (dto.name !== undefined)
                data.name = dto.name;
            if (dto.websiteUrl !== undefined)
                data.websiteUrl = dto.websiteUrl;
            if (dto.scraperType !== undefined)
                data.scraperType = dto.scraperType;
            if (dto.selectorsJson !== undefined) {
                data.selectorsJson =
                    dto.selectorsJson === null
                        ? client_1.Prisma.JsonNull
                        : dto.selectorsJson;
            }
            if (dto.active !== undefined)
                data.active = dto.active;
            return this.prisma.scrapedEventSource.update({ where: { id }, data });
        }
        async remove(id) {
            await this.findOne(id);
            await this.prisma.scrapedEventSource.delete({ where: { id } });
            return { ok: true };
        }
    };
    return ScrapedEventSourcesService = _classThis;
})();
exports.ScrapedEventSourcesService = ScrapedEventSourcesService;
//# sourceMappingURL=scraped-event-sources.service.js.map