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
exports.CategoryAdminBlogsService = void 0;
const common_1 = require("@nestjs/common");
let CategoryAdminBlogsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CategoryAdminBlogsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminBlogsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async getCategoryAdminCategoryIds(categoryAdminId) {
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { id: categoryAdminId },
                select: {
                    categoryId: true,
                    categories: { select: { categoryId: true } },
                },
            });
            if (!admin)
                return [];
            return [
                admin.categoryId,
                ...admin.categories.map((c) => c.categoryId),
            ].filter((id, i, arr) => arr.indexOf(id) === i);
        }
        async ensureBlogAccess(blogId, categoryAdminId) {
            const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
            const blog = await this.prisma.blogPost.findFirst({
                where: { id: blogId, categoryId: { in: categoryIds } },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
            if (!blog)
                throw new common_1.NotFoundException('Blog post not found');
            return blog;
        }
        /** DB column may exist before Prisma client types include `publishedAt` */
        async setBlogPublishedAt(blogId, at) {
            if (at) {
                await this.prisma.$executeRaw `
        UPDATE \`blog_posts\` SET \`publishedAt\` = ${at} WHERE \`id\` = ${blogId}
      `;
            }
            else {
                await this.prisma.$executeRaw `
        UPDATE \`blog_posts\` SET \`publishedAt\` = NULL WHERE \`id\` = ${blogId}
      `;
            }
        }
        async findPending(categoryAdminId) {
            const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
            if (categoryIds.length === 0)
                return [];
            return this.prisma.blogPost.findMany({
                where: { categoryId: { in: categoryIds }, status: 'pending' },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        /** Approved blogs (drafts + published) for View blogs */
        async findApprovedForCategoryAdmin(categoryAdminId) {
            const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
            if (categoryIds.length === 0)
                return [];
            return this.prisma.blogPost.findMany({
                where: { categoryId: { in: categoryIds }, status: 'approved' },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }
        async update(blogId, categoryAdminId, dto) {
            await this.ensureBlogAccess(blogId, categoryAdminId);
            const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
            if (!blog || blog.status !== 'pending') {
                throw new common_1.ForbiddenException('Only pending blog posts can be edited');
            }
            return this.prisma.blogPost.update({
                where: { id: blogId },
                data: {
                    ...(dto.title !== undefined && { title: dto.title.trim() }),
                    ...(dto.content !== undefined && { content: dto.content.trim() }),
                    ...(dto.coverImageUrl !== undefined && {
                        coverImageUrl: dto.coverImageUrl?.trim() || null,
                    }),
                },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
        }
        async revert(blogId, categoryAdminId, revertNotes) {
            await this.ensureBlogAccess(blogId, categoryAdminId);
            const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
            if (!blog || blog.status !== 'pending') {
                throw new common_1.ForbiddenException('Only pending blog posts can be sent back for suggestions');
            }
            return this.prisma.blogPost.update({
                where: { id: blogId },
                data: { status: 'reverted', revertNotes },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
        }
        async reject(blogId, categoryAdminId, rejectNotes) {
            await this.ensureBlogAccess(blogId, categoryAdminId);
            const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
            if (!blog || blog.status !== 'pending') {
                throw new common_1.ForbiddenException('Only pending blog posts can be rejected');
            }
            return this.prisma.blogPost.update({
                where: { id: blogId },
                data: { status: 'rejected', rejectNotes },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
        }
        /** Approve = live on public feed (same as news). No separate publish step. */
        async approve(blogId, categoryAdminId) {
            await this.ensureBlogAccess(blogId, categoryAdminId);
            const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
            if (!blog || blog.status !== 'pending') {
                throw new common_1.ForbiddenException('Only pending blog posts can be approved');
            }
            const now = new Date();
            await this.prisma.blogPost.update({
                where: { id: blogId },
                data: { status: 'approved', published: true },
            });
            await this.setBlogPublishedAt(blogId, now);
            return this.prisma.blogPost.findUnique({
                where: { id: blogId },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
        }
        /** Publish a previously saved draft */
        async publishDraft(blogId, categoryAdminId) {
            await this.ensureBlogAccess(blogId, categoryAdminId);
            const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
            if (!blog || blog.status !== 'approved' || blog.published) {
                throw new common_1.ForbiddenException('Only approved drafts can be published');
            }
            await this.prisma.blogPost.update({
                where: { id: blogId },
                data: { published: true },
            });
            await this.setBlogPublishedAt(blogId, new Date());
            return this.prisma.blogPost.findUnique({
                where: { id: blogId },
                include: {
                    subCategory: { select: { id: true, name: true } },
                    subCategoryAdmin: { select: { id: true, name: true, email: true } },
                },
            });
        }
        /** Remove an approved blog from the public site (category admin only). */
        async removeApproved(blogId, categoryAdminId) {
            await this.ensureBlogAccess(blogId, categoryAdminId);
            const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
            if (!blog || blog.status !== 'approved') {
                throw new common_1.ForbiddenException('Only approved blogs can be deleted here');
            }
            await this.prisma.blogPost.delete({ where: { id: blogId } });
            return { ok: true };
        }
    };
    return CategoryAdminBlogsService = _classThis;
})();
exports.CategoryAdminBlogsService = CategoryAdminBlogsService;
//# sourceMappingURL=category-admin-blogs.service.js.map