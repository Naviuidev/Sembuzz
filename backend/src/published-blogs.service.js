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
exports.PublishedBlogsService = void 0;
const common_1 = require("@nestjs/common");
let PublishedBlogsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PublishedBlogsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PublishedBlogsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async listPublishedBlogs(schoolId, q, fromStr, toStr, subCategoryIdsCsv) {
            const subIds = typeof subCategoryIdsCsv === 'string' && subCategoryIdsCsv.trim()
                ? subCategoryIdsCsv.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
            const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
            const dateOk = (s) => !!s && typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
            const hasRange = dateOk(fromStr) && dateOk(toStr);
            const fromD = hasRange ? new Date(fromStr.trim() + 'T00:00:00.000Z') : null;
            const toD = hasRange ? new Date(toStr.trim() + 'T23:59:59.999Z') : null;
            const andFilters = [];
            const term = typeof q === 'string' ? q.trim() : '';
            if (term) {
                andFilters.push({
                    OR: [
                        { title: { contains: term } },
                        { content: { contains: term } },
                    ],
                });
            }
            const baseWhere = {
                status: 'approved',
                ...(sid ? { schoolId: sid } : {}),
                ...(subIds.length ? { subCategoryId: { in: subIds } } : {}),
                ...(andFilters.length ? { AND: andFilters } : {}),
            };
            if (hasRange && fromD && toD) {
                const rangeFilter = {
                    updatedAt: { gte: fromD, lte: toD },
                };
                baseWhere.AND = [
                    ...(Array.isArray(baseWhere.AND)
                        ? baseWhere.AND
                        : baseWhere.AND
                            ? [baseWhere.AND]
                            : []),
                    rangeFilter,
                ];
            }
            const selectFull = {
                id: true,
                title: true,
                content: true,
                coverImageUrl: true,
                publishedAt: true,
                createdAt: true,
                updatedAt: true,
                school: { select: { id: true, name: true, image: true } },
                subCategory: { select: { id: true, name: true } },
                subCategoryAdmin: { select: { id: true, name: true } },
            };
            try {
                const rows = await this.prisma.blogPost.findMany({
                    where: baseWhere,
                    select: selectFull,
                    orderBy: { updatedAt: 'desc' },
                    take: 200,
                });
                return rows.map((r) => ({
                    ...r,
                    publishedAt: r.publishedAt ?? r.updatedAt,
                }));
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error('[PublishedBlogs] list query failed:', msg);
                if (msg.includes('publishedAt') ||
                    msg.includes('Unknown column') ||
                    msg.includes('does not exist')) {
                    try {
                        const rows = await this.prisma.blogPost.findMany({
                            where: {
                                status: 'approved',
                                ...(sid ? { schoolId: sid } : {}),
                                ...(subIds.length ? { subCategoryId: { in: subIds } } : {}),
                                ...(term
                                    ? {
                                        OR: [
                                            { title: { contains: term } },
                                            { content: { contains: term } },
                                        ],
                                    }
                                    : {}),
                                ...(hasRange && fromD && toD
                                    ? { updatedAt: { gte: fromD, lte: toD } }
                                    : {}),
                            },
                            select: {
                                id: true,
                                title: true,
                                content: true,
                                coverImageUrl: true,
                                createdAt: true,
                                updatedAt: true,
                                school: { select: { id: true, name: true, image: true } },
                                subCategory: { select: { id: true, name: true } },
                                subCategoryAdmin: { select: { id: true, name: true } },
                            },
                            orderBy: { updatedAt: 'desc' },
                            take: 200,
                        });
                        return rows.map((r) => ({
                            ...r,
                            publishedAt: r.updatedAt.toISOString(),
                        }));
                    }
                    catch (e2) {
                        console.error('[PublishedBlogs] list fallback failed:', e2);
                    }
                }
                throw new common_1.HttpException({
                    statusCode: 500,
                    message: 'Could not load blogs. Ensure migrations are applied (npx prisma migrate deploy) and the blog_posts table exists.',
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getPublishedBlogById(id) {
            const blog = await this.prisma.blogPost.findFirst({
                where: { id, status: 'approved' },
                include: {
                    school: { select: { id: true, name: true, image: true } },
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true } },
                },
            });
            if (!blog)
                throw new common_1.NotFoundException('Blog not found');
            return blog;
        }
    };
    return PublishedBlogsService = _classThis;
})();
exports.PublishedBlogsService = PublishedBlogsService;
//# sourceMappingURL=published-blogs.service.js.map