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
exports.CategoryAdminBannerAdsService = void 0;
const common_1 = require("@nestjs/common");
let CategoryAdminBannerAdsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CategoryAdminBannerAdsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminBannerAdsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async getCategoryAdminSchoolAndCategory(categoryAdminId) {
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { id: categoryAdminId },
                select: { schoolId: true, categoryId: true },
            });
            return admin ? { schoolId: admin.schoolId, categoryId: admin.categoryId } : null;
        }
        async create(categoryAdminId, dto) {
            const scope = await this.getCategoryAdminSchoolAndCategory(categoryAdminId);
            if (!scope)
                throw new common_1.ForbiddenException('Category admin not found');
            const startAt = new Date(dto.startAt);
            const endAt = new Date(dto.endAt);
            if (endAt <= startAt) {
                throw new common_1.ForbiddenException('End date/time must be after start date/time');
            }
            return this.prisma.bannerAd.create({
                data: {
                    categoryAdminId,
                    categoryId: scope.categoryId,
                    schoolId: scope.schoolId,
                    imageUrl: dto.imageUrl,
                    externalLink: dto.externalLink?.trim() || null,
                    startAt,
                    endAt,
                },
            });
        }
        async listByCategoryAdmin(categoryAdminId) {
            return this.prisma.bannerAd.findMany({
                where: { categoryAdminId },
                orderBy: { createdAt: 'desc' },
                select: { id: true, imageUrl: true, externalLink: true, startAt: true, endAt: true, createdAt: true },
            });
        }
        async getAnalytics(categoryAdminId, dateFrom, dateTo, bannerAdId) {
            const whereAd = { categoryAdminId };
            if (bannerAdId)
                whereAd.id = bannerAdId;
            const ads = await this.prisma.bannerAd.findMany({
                where: whereAd,
                select: { id: true, imageUrl: true, externalLink: true, startAt: true, endAt: true },
                orderBy: { createdAt: 'desc' },
            });
            const adIds = ads.map((a) => a.id);
            if (adIds.length === 0) {
                return { ads: [], totals: { views: 0, clicks: 0 }, byDay: [] };
            }
            const eventWhere = { bannerAdId: { in: adIds } };
            if (dateFrom && dateTo) {
                eventWhere.createdAt = {
                    gte: new Date(dateFrom + 'T00:00:00.000Z'),
                    lte: new Date(dateTo + 'T23:59:59.999Z'),
                };
            }
            const events = await this.prisma.bannerAdEvent.findMany({
                where: eventWhere,
                select: { bannerAdId: true, eventType: true, createdAt: true },
            });
            const viewsByAd = {};
            const clicksByAd = {};
            adIds.forEach((id) => ((viewsByAd[id] = 0), (clicksByAd[id] = 0)));
            const byDayMap = {};
            events.forEach((e) => {
                const day = e.createdAt.toISOString().slice(0, 10);
                if (!byDayMap[day])
                    byDayMap[day] = { views: 0, clicks: 0 };
                if (e.eventType === 'view') {
                    viewsByAd[e.bannerAdId]++;
                    byDayMap[day].views++;
                }
                else if (e.eventType === 'click') {
                    clicksByAd[e.bannerAdId]++;
                    byDayMap[day].clicks++;
                }
            });
            const byDay = Object.entries(byDayMap)
                .map(([date, v]) => ({ date, views: v.views, clicks: v.clicks }))
                .sort((a, b) => a.date.localeCompare(b.date));
            const totals = { views: Object.values(viewsByAd).reduce((a, b) => a + b, 0), clicks: Object.values(clicksByAd).reduce((a, b) => a + b, 0) };
            return {
                ads: ads.map((a) => ({ ...a, views: viewsByAd[a.id], clicks: clicksByAd[a.id] })),
                totals,
                byDay,
            };
        }
        async updateSchedule(categoryAdminId, bannerAdId, dto) {
            const ad = await this.prisma.bannerAd.findFirst({
                where: { id: bannerAdId, categoryAdminId },
            });
            if (!ad)
                throw new common_1.ForbiddenException('Banner ad not found');
            const startAt = new Date(dto.startAt);
            const endAt = new Date(dto.endAt);
            if (endAt <= startAt) {
                throw new common_1.ForbiddenException('End date/time must be after start date/time');
            }
            return this.prisma.bannerAd.update({
                where: { id: bannerAdId },
                data: {
                    startAt,
                    endAt,
                    ...(dto.externalLink !== undefined ? { externalLink: dto.externalLink?.trim() || null } : {}),
                },
            });
        }
        async endNow(categoryAdminId, bannerAdId) {
            const ad = await this.prisma.bannerAd.findFirst({
                where: { id: bannerAdId, categoryAdminId },
            });
            if (!ad)
                throw new common_1.ForbiddenException('Banner ad not found');
            const now = new Date();
            return this.prisma.bannerAd.update({
                where: { id: bannerAdId },
                data: { endAt: now },
            });
        }
        async remove(categoryAdminId, bannerAdId) {
            const ad = await this.prisma.bannerAd.findFirst({
                where: { id: bannerAdId, categoryAdminId },
            });
            if (!ad)
                throw new common_1.ForbiddenException('Banner ad not found');
            const now = new Date();
            if (now >= ad.startAt && now <= ad.endAt) {
                throw new common_1.ForbiddenException('Cannot delete an active ad. Set the ad to inactive first, then you can delete it.');
            }
            await this.prisma.bannerAd.delete({ where: { id: bannerAdId } });
            return { deleted: true };
        }
    };
    return CategoryAdminBannerAdsService = _classThis;
})();
exports.CategoryAdminBannerAdsService = CategoryAdminBannerAdsService;
//# sourceMappingURL=banner-ads.service.js.map