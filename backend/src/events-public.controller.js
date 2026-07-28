"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsPublicController = void 0;
const common_1 = require("@nestjs/common");
let EventsPublicController = (() => {
    let _classDecorators = [(0, common_1.Controller)('events')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getCategoriesBySchool_decorators;
    let _findApproved_decorators;
    let _getUpcomingByDate_decorators;
    let _getEngagementCounts_decorators;
    let _getActiveBannerAds_decorators;
    let _recordBannerAdView_decorators;
    let _recordBannerAdClick_decorators;
    let _getActiveSponsoredAds_decorators;
    let _recordSponsoredAdView_decorators;
    let _recordSponsoredAdClick_decorators;
    let _blogsPublished_decorators;
    let _blogsPublishedLegacy_decorators;
    let _blogById_decorators;
    var EventsPublicController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getCategoriesBySchool_decorators = [(0, common_1.Get)('categories')];
            _findApproved_decorators = [(0, common_1.Get)('approved')];
            _getUpcomingByDate_decorators = [(0, common_1.Get)('upcoming')];
            _getEngagementCounts_decorators = [(0, common_1.Get)('engagement-counts')];
            _getActiveBannerAds_decorators = [(0, common_1.Get)('banner-ads')];
            _recordBannerAdView_decorators = [(0, common_1.Post)('banner-ads/:id/view')];
            _recordBannerAdClick_decorators = [(0, common_1.Post)('banner-ads/:id/click')];
            _getActiveSponsoredAds_decorators = [(0, common_1.Get)('sponsored-ads')];
            _recordSponsoredAdView_decorators = [(0, common_1.Post)('sponsored-ads/:id/view')];
            _recordSponsoredAdClick_decorators = [(0, common_1.Post)('sponsored-ads/:id/click')];
            _blogsPublished_decorators = [(0, common_1.Get)('blogs')];
            _blogsPublishedLegacy_decorators = [(0, common_1.Get)('published-blogs')];
            _blogById_decorators = [(0, common_1.Get)('blog/:id')];
            __esDecorate(this, null, _getCategoriesBySchool_decorators, { kind: "method", name: "getCategoriesBySchool", static: false, private: false, access: { has: obj => "getCategoriesBySchool" in obj, get: obj => obj.getCategoriesBySchool }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findApproved_decorators, { kind: "method", name: "findApproved", static: false, private: false, access: { has: obj => "findApproved" in obj, get: obj => obj.findApproved }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getUpcomingByDate_decorators, { kind: "method", name: "getUpcomingByDate", static: false, private: false, access: { has: obj => "getUpcomingByDate" in obj, get: obj => obj.getUpcomingByDate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getEngagementCounts_decorators, { kind: "method", name: "getEngagementCounts", static: false, private: false, access: { has: obj => "getEngagementCounts" in obj, get: obj => obj.getEngagementCounts }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getActiveBannerAds_decorators, { kind: "method", name: "getActiveBannerAds", static: false, private: false, access: { has: obj => "getActiveBannerAds" in obj, get: obj => obj.getActiveBannerAds }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _recordBannerAdView_decorators, { kind: "method", name: "recordBannerAdView", static: false, private: false, access: { has: obj => "recordBannerAdView" in obj, get: obj => obj.recordBannerAdView }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _recordBannerAdClick_decorators, { kind: "method", name: "recordBannerAdClick", static: false, private: false, access: { has: obj => "recordBannerAdClick" in obj, get: obj => obj.recordBannerAdClick }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getActiveSponsoredAds_decorators, { kind: "method", name: "getActiveSponsoredAds", static: false, private: false, access: { has: obj => "getActiveSponsoredAds" in obj, get: obj => obj.getActiveSponsoredAds }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _recordSponsoredAdView_decorators, { kind: "method", name: "recordSponsoredAdView", static: false, private: false, access: { has: obj => "recordSponsoredAdView" in obj, get: obj => obj.recordSponsoredAdView }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _recordSponsoredAdClick_decorators, { kind: "method", name: "recordSponsoredAdClick", static: false, private: false, access: { has: obj => "recordSponsoredAdClick" in obj, get: obj => obj.recordSponsoredAdClick }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _blogsPublished_decorators, { kind: "method", name: "blogsPublished", static: false, private: false, access: { has: obj => "blogsPublished" in obj, get: obj => obj.blogsPublished }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _blogsPublishedLegacy_decorators, { kind: "method", name: "blogsPublishedLegacy", static: false, private: false, access: { has: obj => "blogsPublishedLegacy" in obj, get: obj => obj.blogsPublishedLegacy }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _blogById_decorators, { kind: "method", name: "blogById", static: false, private: false, access: { has: obj => "blogById" in obj, get: obj => obj.blogById }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EventsPublicController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma = __runInitializers(this, _instanceExtraInitializers);
        publishedBlogs;
        constructor(prisma, publishedBlogs) {
            this.prisma = prisma;
            this.publishedBlogs = publishedBlogs;
        }
        async getCategoriesBySchool(schoolId) {
            const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
            if (!sid)
                return [];
            return this.prisma.category.findMany({
                where: { schoolId: sid },
                include: {
                    subcategories: { select: { id: true, name: true } },
                },
                orderBy: { name: 'asc' },
            });
        }
        /** Same Event table as category-admin/events/approved; returns all approved events (all schools) when no schoolId. Used by public /events page (guest + logged-in). */
        async findApproved(schoolId, subCategoryIdsStr) {
            const subCategoryIds = subCategoryIdsStr && subCategoryIdsStr.trim()
                ? subCategoryIdsStr.split(',').map((id) => id.trim()).filter(Boolean)
                : undefined;
            const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
            const where = {
                status: 'approved',
                ...(sid ? { schoolId: sid } : {}),
                ...(subCategoryIds?.length
                    ? { subCategoryId: { in: subCategoryIds } }
                    : {}),
            };
            try {
                // Debug: log counts so we can see if approved events exist in DB
                const [totalEvents, approvedCount, list] = await Promise.all([
                    this.prisma.event.count(),
                    this.prisma.event.count({ where: { status: 'approved' } }),
                    this.prisma.event.findMany({
                        where,
                        include: {
                            school: { select: { name: true, image: true } },
                            subCategory: { select: { id: true, name: true } },
                        },
                        orderBy: { updatedAt: 'desc' },
                        take: 500,
                    }),
                ]);
                console.log(`[Events] GET /events/approved${sid ? ` schoolId=${sid}` : ' (all schools)'}: ` +
                    `returning ${list.length}, DB has ${approvedCount} approved / ${totalEvents} total events`);
                return list;
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error('[Events] GET /events/approved error:', message, err);
                throw new common_1.HttpException({ statusCode: 500, message: 'Failed to load approved events' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /** Upcoming/scheduled posts by date/range (school admin created). Public, no auth.
         * - date=YYYY-MM-DD (single day)
         * - from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive range)
         */
        async getUpcomingByDate(dateStr, fromStr, toStr) {
            let dayStart;
            let dayEnd;
            const from = typeof fromStr === 'string' ? fromStr.trim() : '';
            const to = typeof toStr === 'string' ? toStr.trim() : '';
            const date = typeof dateStr === 'string' ? dateStr.trim() : '';
            if (from && to) {
                dayStart = new Date(`${from}T00:00:00.000Z`);
                dayEnd = new Date(`${to}T23:59:59.999Z`);
            }
            else if (date) {
                dayStart = new Date(`${date}T00:00:00.000Z`);
                dayEnd = new Date(`${date}T23:59:59.999Z`);
            }
            else {
                return [];
            }
            if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime()))
                return [];
            if (dayStart > dayEnd)
                return [];
            return this.prisma.upcomingPost.findMany({
                where: { scheduledTo: { gte: dayStart, lte: dayEnd } },
                include: {
                    school: { select: { id: true, name: true, image: true } },
                    category: { select: { id: true, name: true } },
                    subCategory: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        /** Public like, comment, and saved counts for event IDs (no auth). Optional dateFrom/dateTo (YYYY-MM-DD) filter engagement by when the action happened. */
        async getEngagementCounts(eventIdsStr, dateFromStr, dateToStr) {
            const eventIds = eventIdsStr && eventIdsStr.trim()
                ? eventIdsStr.split(',').map((id) => id.trim()).filter(Boolean)
                : [];
            if (eventIds.length === 0) {
                return {
                    likes: {},
                    commentCounts: {},
                    savedCounts: {},
                };
            }
            const eventFilter = { eventId: { in: eventIds } };
            let dateFilter = {};
            if (dateFromStr && typeof dateFromStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateFromStr.trim())) {
                dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(dateFromStr.trim() + 'T00:00:00.000Z') };
            }
            if (dateToStr && typeof dateToStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateToStr.trim())) {
                dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(dateToStr.trim() + 'T23:59:59.999Z') };
            }
            const whereLike = { ...eventFilter, ...(Object.keys(dateFilter).length ? dateFilter : {}) };
            const whereComment = { ...eventFilter, ...(Object.keys(dateFilter).length ? dateFilter : {}) };
            const whereSaved = { ...eventFilter, ...(Object.keys(dateFilter).length ? dateFilter : {}) };
            const [likeCounts, commentCounts, savedCounts] = await Promise.all([
                this.prisma.eventLike.groupBy({
                    by: ['eventId'],
                    where: whereLike,
                    _count: { eventId: true },
                }),
                this.prisma.eventComment.groupBy({
                    by: ['eventId'],
                    where: whereComment,
                    _count: { eventId: true },
                }),
                this.prisma.userSavedEvent.groupBy({
                    by: ['eventId'],
                    where: whereSaved,
                    _count: { eventId: true },
                }),
            ]);
            const likes = {};
            eventIds.forEach((id) => (likes[id] = 0));
            likeCounts.forEach((g) => (likes[g.eventId] = g._count.eventId));
            const commentCountsMap = {};
            eventIds.forEach((id) => (commentCountsMap[id] = 0));
            commentCounts.forEach((g) => (commentCountsMap[g.eventId] = g._count.eventId));
            const savedCountsMap = {};
            eventIds.forEach((id) => (savedCountsMap[id] = 0));
            savedCounts.forEach((g) => (savedCountsMap[g.eventId] = g._count.eventId));
            return { likes, commentCounts: commentCountsMap, savedCounts: savedCountsMap };
        }
        /** Active banner ads: startAt <= now <= endAt. Optional schoolId to filter by school. For guests and logged-in users. */
        async getActiveBannerAds(schoolId) {
            const now = new Date();
            const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
            const list = await this.prisma.bannerAd.findMany({
                where: {
                    startAt: { lte: now },
                    endAt: { gte: now },
                    ...(sid ? { schoolId: sid } : {}),
                },
                select: {
                    id: true,
                    imageUrl: true,
                    externalLink: true,
                    startAt: true,
                    endAt: true,
                    schoolId: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            return list;
        }
        /** Record a view for a banner ad (public, no auth). Ad must be active. */
        async recordBannerAdView(id) {
            const now = new Date();
            const ad = await this.prisma.bannerAd.findFirst({
                where: { id, startAt: { lte: now }, endAt: { gte: now } },
            });
            if (!ad)
                return { ok: false };
            await this.prisma.bannerAdEvent.create({ data: { bannerAdId: id, eventType: 'view' } });
            return { ok: true };
        }
        /** Record a click for a banner ad and return redirect URL (public, no auth). Ad must be active. */
        async recordBannerAdClick(id) {
            const now = new Date();
            const ad = await this.prisma.bannerAd.findFirst({
                where: { id, startAt: { lte: now }, endAt: { gte: now } },
                select: { externalLink: true },
            });
            if (!ad)
                return { ok: false };
            await this.prisma.bannerAdEvent.create({ data: { bannerAdId: id, eventType: 'click' } });
            return { ok: true, redirectUrl: ad.externalLink ?? null };
        }
        /** Active sponsored ads: startAt <= now <= endAt. Optional schoolId. Same UI as news, light blue bg, "Ad" badge. */
        async getActiveSponsoredAds(schoolId) {
            const now = new Date();
            const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
            const list = await this.prisma.sponsoredAd.findMany({
                where: {
                    startAt: { lte: now },
                    endAt: { gte: now },
                    ...(sid ? { schoolId: sid } : {}),
                },
                include: { school: { select: { id: true, name: true, image: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            return list;
        }
        async recordSponsoredAdView(id) {
            const now = new Date();
            const ad = await this.prisma.sponsoredAd.findFirst({
                where: { id, startAt: { lte: now }, endAt: { gte: now } },
            });
            if (!ad)
                return { ok: false };
            await this.prisma.sponsoredAdEvent.create({ data: { sponsoredAdId: id, eventType: 'view' } });
            return { ok: true };
        }
        async recordSponsoredAdClick(id) {
            const now = new Date();
            const ad = await this.prisma.sponsoredAd.findFirst({
                where: { id, startAt: { lte: now }, endAt: { gte: now } },
                select: { externalLink: true },
            });
            if (!ad)
                return { ok: false };
            await this.prisma.sponsoredAdEvent.create({ data: { sponsoredAdId: id, eventType: 'click' } });
            return { ok: true, redirectUrl: ad.externalLink ?? null };
        }
        /** Published blogs — delegates to PublishedBlogsService (same as GET /public/blogs). */
        blogsPublished(schoolId, q, fromStr, toStr, subCategoryIds) {
            return this.publishedBlogs.listPublishedBlogs(schoolId, q, fromStr, toStr, subCategoryIds);
        }
        blogsPublishedLegacy(schoolId, q, fromStr, toStr, subCategoryIds) {
            return this.publishedBlogs.listPublishedBlogs(schoolId, q, fromStr, toStr, subCategoryIds);
        }
        blogById(id) {
            return this.publishedBlogs.getPublishedBlogById(id);
        }
    };
    return EventsPublicController = _classThis;
})();
exports.EventsPublicController = EventsPublicController;
//# sourceMappingURL=events-public.controller.js.map