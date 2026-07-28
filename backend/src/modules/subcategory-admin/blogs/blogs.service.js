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
exports.SubCategoryAdminBlogsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const blog_blocks_util_1 = require("./blog-blocks.util");
const BLOG_MIGRATE_HINT = 'Run from the backend folder: npx prisma migrate deploy  (then restart the API)';
let SubCategoryAdminBlogsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SubCategoryAdminBlogsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminBlogsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new common_1.Logger(SubCategoryAdminBlogsService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        async ensureSubCategoryForAdmin(subCategoryAdminId, subCategoryId) {
            const admin = await this.prisma.subCategoryAdmin.findUnique({
                where: { id: subCategoryAdminId },
                select: {
                    subCategoryId: true,
                    subCategories: { select: { subCategoryId: true } },
                },
            });
            if (!admin)
                throw new common_1.ForbiddenException('Subcategory admin not found');
            const allowed = new Set([
                admin.subCategoryId,
                ...admin.subCategories.map((s) => s.subCategoryId),
            ]);
            if (!allowed.has(subCategoryId)) {
                throw new common_1.BadRequestException('Invalid subcategory. Pick a subcategory you manage.');
            }
        }
        async create(subCategoryAdminId, dto) {
            await this.ensureSubCategoryForAdmin(subCategoryAdminId, dto.subCategoryId);
            const admin = await this.prisma.subCategoryAdmin.findUnique({
                where: { id: subCategoryAdminId },
                select: { categoryId: true, schoolId: true },
            });
            if (!admin)
                throw new common_1.ForbiddenException('Subcategory admin not found');
            const imageUrlsJson = dto.imageUrls?.length ? JSON.stringify(dto.imageUrls) : null;
            const blocks = (0, blog_blocks_util_1.sanitizeContentBlocks)(Array.isArray(dto.contentBlocks) ? dto.contentBlocks : null);
            const body = (dto.content ?? '').trim();
            if (!(0, blog_blocks_util_1.blocksHaveText)(blocks) && !body) {
                throw new common_1.BadRequestException('Add at least one text block (heading, paragraph, or heading + paragraph) or write body text.');
            }
            const rawContent = body ||
                (0, blog_blocks_util_1.extractTextFromBlocks)(blocks) ||
                dto.title.trim();
            /** Full article lives in contentBlocks; this column is listing/search only. */
            const content = (0, blog_blocks_util_1.clipForMysqlText)(rawContent);
            let contentBlocksJson = blocks?.length ? JSON.parse(JSON.stringify(blocks)) : undefined;
            try {
                return await this.prisma.blogPost.create({
                    data: {
                        subCategoryAdminId,
                        subCategoryId: dto.subCategoryId,
                        categoryId: admin.categoryId,
                        schoolId: admin.schoolId,
                        title: dto.title.trim(),
                        content,
                        coverImageUrl: dto.coverImageUrl?.trim() || null,
                        imageUrls: imageUrlsJson,
                        heroTitle: dto.heroTitle?.trim().slice(0, 300) || null,
                        heroParagraph: dto.heroParagraph?.trim() || null,
                        heroButtonText: dto.heroButtonText?.trim().slice(0, 120) || null,
                        heroButtonLink: dto.heroButtonLink?.trim().slice(0, 2048) || null,
                        contentBlocks: contentBlocksJson ?? undefined,
                        status: 'pending',
                        published: false,
                    },
                    include: {
                        subCategory: { select: { id: true, name: true } },
                    },
                });
            }
            catch (e) {
                if (e instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (e.code === 'P2003') {
                        throw new common_1.BadRequestException('Invalid subcategory.');
                    }
                    if (e.code === 'P2000') {
                        throw new common_1.BadRequestException('Content is too long for one database field. Try shorter paragraphs or run the latest DB migration (contentBlocks column).');
                    }
                    // Table missing in DB
                    if (e.code === 'P2021' || e.code === 'P2010') {
                        throw new common_1.BadRequestException(`Blog storage is not set up. ${BLOG_MIGRATE_HINT}`);
                    }
                }
                const msg = e instanceof Error ? e.message : String(e);
                this.logger.error(`Blog create failed: ${msg}`, e instanceof Error ? e.stack : undefined);
                if (msg.includes('blog_posts') &&
                    (msg.includes("doesn't exist") ||
                        msg.includes('does not exist') ||
                        msg.includes('Unknown table'))) {
                    throw new common_1.BadRequestException(`Blog table missing. ${BLOG_MIGRATE_HINT}`);
                }
                if (msg.includes('Too long') || msg.includes('Data too long')) {
                    throw new common_1.BadRequestException('A field is too long (e.g. image URL). Shorten title or use smaller images.');
                }
                throw new common_1.BadRequestException(process.env.NODE_ENV === 'production'
                    ? 'Could not save the blog. Check that the database is migrated and try again.'
                    : msg);
            }
        }
        async findPending(subCategoryAdminId) {
            return this.prisma.blogPost.findMany({
                where: { subCategoryAdminId, status: 'pending' },
                include: { subCategory: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
        async findReverted(subCategoryAdminId) {
            return this.prisma.blogPost.findMany({
                where: { subCategoryAdminId, status: 'reverted' },
                include: { subCategory: { select: { id: true, name: true } } },
                orderBy: { updatedAt: 'desc' },
            });
        }
        async findRejected(subCategoryAdminId) {
            return this.prisma.blogPost.findMany({
                where: { subCategoryAdminId, status: 'rejected' },
                include: { subCategory: { select: { id: true, name: true } } },
                orderBy: { updatedAt: 'desc' },
            });
        }
        async findApproved(subCategoryAdminId) {
            return this.prisma.blogPost.findMany({
                where: { subCategoryAdminId, status: 'approved' },
                include: { subCategory: { select: { id: true, name: true } } },
                orderBy: { updatedAt: 'desc' },
            });
        }
    };
    return SubCategoryAdminBlogsService = _classThis;
})();
exports.SubCategoryAdminBlogsService = SubCategoryAdminBlogsService;
//# sourceMappingURL=blogs.service.js.map