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
exports.AdminActionItemsService = void 0;
const common_1 = require("@nestjs/common");
let AdminActionItemsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AdminActionItemsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AdminActionItemsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        buildResponse(items) {
            const filtered = items.filter((i) => i.count > 0);
            return {
                totalCount: filtered.reduce((sum, i) => sum + i.count, 0),
                items: filtered.sort((a, b) => {
                    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return tb - ta;
                }),
            };
        }
        async latestCreatedAt(model, where) {
            const row = await model.findFirst({
                where,
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            });
            return row?.createdAt.toISOString();
        }
        async categoryIdsForAdmin(categoryAdminId) {
            const admin = await this.prisma.categoryAdmin.findUnique({
                where: { id: categoryAdminId },
                select: { categoryId: true, categories: { select: { categoryId: true } } },
            });
            if (!admin)
                return [];
            return [admin.categoryId, ...admin.categories.map((c) => c.categoryId)].filter((id, i, arr) => arr.indexOf(id) === i);
        }
        async forSchoolAdmin(schoolId) {
            const [pendingUsers, chatRequests, categoryQueries, subcategoryQueries, userHelp, latestUser, latestChat, latestCatQ, latestSubQ, latestHelp,] = await Promise.all([
                this.prisma.user.count({ where: { schoolId, status: 'pending_approval' } }),
                this.prisma.clubGroupChatRequest.count({ where: { schoolId, status: 'pending' } }),
                this.prisma.categoryAdminQuery.count({ where: { schoolId, status: 'pending' } }),
                this.prisma.subCategoryAdminToSchoolAdminQuery.count({ where: { schoolId, status: 'pending' } }),
                this.prisma.userHelpQuery.count({ where: { schoolId, status: 'open' } }),
                this.latestCreatedAt(this.prisma.user, { schoolId, status: 'pending_approval' }),
                this.latestCreatedAt(this.prisma.clubGroupChatRequest, { schoolId, status: 'pending' }),
                this.latestCreatedAt(this.prisma.categoryAdminQuery, { schoolId, status: 'pending' }),
                this.latestCreatedAt(this.prisma.subCategoryAdminToSchoolAdminQuery, { schoolId, status: 'pending' }),
                this.latestCreatedAt(this.prisma.userHelpQuery, { schoolId, status: 'open' }),
            ]);
            return this.buildResponse([
                {
                    id: 'pending-users',
                    kind: 'pending_users',
                    title: 'User registration approvals',
                    summary: `${pendingUsers} student${pendingUsers === 1 ? '' : 's'} waiting for approval`,
                    href: '/school-admin/user-requests',
                    count: pendingUsers,
                    createdAt: latestUser,
                },
                {
                    id: 'club-group-chat-requests',
                    kind: 'club_group_chat_requests',
                    title: 'Group chat requests',
                    summary: `${chatRequests} club group chat request${chatRequests === 1 ? '' : 's'} to review`,
                    href: '/school-admin/privacy?tab=message-config',
                    count: chatRequests,
                    createdAt: latestChat,
                },
                {
                    id: 'category-admin-queries',
                    kind: 'category_admin_queries',
                    title: 'Queries from category admins',
                    summary: `${categoryQueries} quer${categoryQueries === 1 ? 'y' : 'ies'} need a response`,
                    href: '/school-admin/queries',
                    count: categoryQueries,
                    createdAt: latestCatQ,
                },
                {
                    id: 'subcategory-admin-queries',
                    kind: 'subcategory_admin_queries',
                    title: 'Queries from sub-category admins',
                    summary: `${subcategoryQueries} quer${subcategoryQueries === 1 ? 'y' : 'ies'} need a response`,
                    href: '/school-admin/queries',
                    count: subcategoryQueries,
                    createdAt: latestSubQ,
                },
                {
                    id: 'user-help',
                    kind: 'user_help',
                    title: 'Users help',
                    summary: `${userHelp} open help request${userHelp === 1 ? '' : 's'} from students`,
                    href: '/school-admin/user-help',
                    count: userHelp,
                    createdAt: latestHelp,
                },
            ]);
        }
        async forCategoryAdmin(categoryAdminId, schoolId) {
            const categoryIds = await this.categoryIdsForAdmin(categoryAdminId);
            const hasCategories = categoryIds.length > 0;
            const categoryFilter = hasCategories ? { categoryId: { in: categoryIds } } : null;
            const [pendingEvents, pendingBlogs, chatRequests, memberships, subcategoryQueries, schoolQueries, latestEvent, latestBlog, latestChat, latestMember, latestSubQ, latestSchoolQ,] = await Promise.all([
                hasCategories
                    ? this.prisma.event.count({ where: { ...categoryFilter, status: 'pending' } })
                    : 0,
                hasCategories
                    ? this.prisma.blogPost.count({ where: { ...categoryFilter, status: 'pending' } })
                    : 0,
                this.prisma.clubGroupChatRequest.count({ where: { schoolId, status: 'pending' } }),
                0,
                hasCategories
                    ? this.prisma.subCategoryAdminQuery.count({
                        where: { status: 'pending', subCategoryAdmin: { categoryId: { in: categoryIds } } },
                    })
                    : 0,
                this.prisma.schoolAdminToCategoryAdminQuery.count({ where: { schoolId, status: 'pending' } }),
                hasCategories
                    ? this.latestCreatedAt(this.prisma.event, { ...categoryFilter, status: 'pending' })
                    : undefined,
                hasCategories
                    ? this.latestCreatedAt(this.prisma.blogPost, { ...categoryFilter, status: 'pending' })
                    : undefined,
                this.latestCreatedAt(this.prisma.clubGroupChatRequest, { schoolId, status: 'pending' }),
                undefined,
                hasCategories
                    ? this.latestCreatedAt(this.prisma.subCategoryAdminQuery, {
                        status: 'pending',
                        subCategoryAdmin: { categoryId: { in: categoryIds } },
                    })
                    : undefined,
                this.latestCreatedAt(this.prisma.schoolAdminToCategoryAdminQuery, { schoolId, status: 'pending' }),
            ]);
            return this.buildResponse([
                {
                    id: 'pending-events',
                    kind: 'pending_events',
                    title: 'Pending event approvals',
                    summary: `${pendingEvents} event${pendingEvents === 1 ? '' : 's'} awaiting your review`,
                    href: '/category-admin/pending-approvals',
                    count: pendingEvents,
                    createdAt: latestEvent,
                },
                {
                    id: 'pending-blogs',
                    kind: 'pending_blogs',
                    title: 'Pending blog approvals',
                    summary: `${pendingBlogs} blog post${pendingBlogs === 1 ? '' : 's'} awaiting your review`,
                    href: '/category-admin/blogs',
                    count: pendingBlogs,
                    createdAt: latestBlog,
                },
                {
                    id: 'club-group-chat-requests',
                    kind: 'club_group_chat_requests',
                    title: 'Group chat requests',
                    summary: `${chatRequests} club group chat request${chatRequests === 1 ? '' : 's'} to review`,
                    href: '/category-admin/privacy?tab=message-config',
                    count: chatRequests,
                    createdAt: latestChat,
                },
                {
                    id: 'subcategory-queries',
                    kind: 'subcategory_queries',
                    title: 'Queries from sub-category admins',
                    summary: `${subcategoryQueries} quer${subcategoryQueries === 1 ? 'y' : 'ies'} need a response`,
                    href: '/category-admin/queries',
                    count: subcategoryQueries,
                    createdAt: latestSubQ,
                },
                {
                    id: 'school-admin-queries',
                    kind: 'school_admin_queries',
                    title: 'Queries from school admins',
                    summary: `${schoolQueries} quer${schoolQueries === 1 ? 'y' : 'ies'} need a response`,
                    href: '/category-admin/queries',
                    count: schoolQueries,
                    createdAt: latestSchoolQ,
                },
            ]);
        }
        async forSubCategoryAdmin(subCategoryAdminId) {
            const admin = await this.prisma.subCategoryAdmin.findUnique({
                where: { id: subCategoryAdminId },
                select: { schoolId: true, categoryId: true },
            });
            if (!admin)
                return { totalCount: 0, items: [] };
            const [revertedEvents, revertedBlogs, schoolQueries, categoryQueries, memberships, latestEvent, latestBlog, latestSchoolQ, latestCatQ, latestMember,] = await Promise.all([
                this.prisma.event.count({
                    where: { subCategoryAdminId, status: 'reverted', revertNotes: { not: null } },
                }),
                this.prisma.blogPost.count({ where: { subCategoryAdminId, status: 'reverted' } }),
                this.prisma.schoolAdminToSubCategoryAdminQuery.count({
                    where: { schoolId: admin.schoolId, status: 'pending' },
                }),
                this.prisma.categoryAdminToSubCategoryAdminQuery.count({
                    where: { categoryId: admin.categoryId, status: 'pending' },
                }),
                this.prisma.clubGroupMembership.count({
                    where: { schoolId: admin.schoolId, status: 'pending' },
                }),
                this.latestCreatedAt(this.prisma.event, {
                    subCategoryAdminId,
                    status: 'reverted',
                    revertNotes: { not: null },
                }),
                this.latestCreatedAt(this.prisma.blogPost, { subCategoryAdminId, status: 'reverted' }),
                this.latestCreatedAt(this.prisma.schoolAdminToSubCategoryAdminQuery, {
                    schoolId: admin.schoolId,
                    status: 'pending',
                }),
                this.latestCreatedAt(this.prisma.categoryAdminToSubCategoryAdminQuery, {
                    categoryId: admin.categoryId,
                    status: 'pending',
                }),
                this.latestCreatedAt(this.prisma.clubGroupMembership, {
                    schoolId: admin.schoolId,
                    status: 'pending',
                }),
            ]);
            return this.buildResponse([
                {
                    id: 'club-group-memberships',
                    kind: 'club_group_memberships',
                    title: 'Club join requests',
                    summary: `${memberships} student${memberships === 1 ? '' : 's'} waiting to join a club chat`,
                    href: '/subcategory-admin/privacy?tab=messages',
                    count: memberships,
                    createdAt: latestMember,
                },
                {
                    id: 'event-corrections',
                    kind: 'event_corrections',
                    title: 'Event corrections',
                    summary: `${revertedEvents} event${revertedEvents === 1 ? '' : 's'} sent back for edits`,
                    href: '/subcategory-admin/received-corrections',
                    count: revertedEvents,
                    createdAt: latestEvent,
                },
                {
                    id: 'blog-corrections',
                    kind: 'blog_corrections',
                    title: 'Blog corrections',
                    summary: `${revertedBlogs} blog post${revertedBlogs === 1 ? '' : 's'} sent back for edits`,
                    href: '/subcategory-admin/blog-corrections',
                    count: revertedBlogs,
                    createdAt: latestBlog,
                },
                {
                    id: 'school-admin-queries',
                    kind: 'school_admin_queries',
                    title: 'Queries from school admins',
                    summary: `${schoolQueries} quer${schoolQueries === 1 ? 'y' : 'ies'} need a response`,
                    href: '/subcategory-admin/queries',
                    count: schoolQueries,
                    createdAt: latestSchoolQ,
                },
                {
                    id: 'category-admin-queries',
                    kind: 'category_admin_queries',
                    title: 'Queries from category admins',
                    summary: `${categoryQueries} quer${categoryQueries === 1 ? 'y' : 'ies'} need a response`,
                    href: '/subcategory-admin/queries',
                    count: categoryQueries,
                    createdAt: latestCatQ,
                },
            ]);
        }
        async forSuperAdmin() {
            const [schoolQueries, categoryQueries, subcategoryQueries, latestSchool, latestCat, latestSub] = await Promise.all([
                this.prisma.query.count({ where: { status: 'pending' } }),
                this.prisma.categoryAdminToSuperAdminQuery.count({ where: { status: 'pending' } }),
                this.prisma.subCategoryAdminToSuperAdminQuery.count({ where: { status: 'pending' } }),
                this.latestCreatedAt(this.prisma.query, { status: 'pending' }),
                this.latestCreatedAt(this.prisma.categoryAdminToSuperAdminQuery, { status: 'pending' }),
                this.latestCreatedAt(this.prisma.subCategoryAdminToSuperAdminQuery, { status: 'pending' }),
            ]);
            return this.buildResponse([
                {
                    id: 'school-admin-queries',
                    kind: 'school_admin_queries',
                    title: 'Queries from school admins',
                    summary: `${schoolQueries} pending school admin quer${schoolQueries === 1 ? 'y' : 'ies'}`,
                    href: '/super-admin/queries',
                    count: schoolQueries,
                    createdAt: latestSchool,
                },
                {
                    id: 'category-admin-queries',
                    kind: 'category_admin_queries',
                    title: 'Queries from category admins',
                    summary: `${categoryQueries} pending category admin quer${categoryQueries === 1 ? 'y' : 'ies'}`,
                    href: '/super-admin/queries',
                    count: categoryQueries,
                    createdAt: latestCat,
                },
                {
                    id: 'subcategory-admin-queries',
                    kind: 'subcategory_admin_queries',
                    title: 'Queries from sub-category admins',
                    summary: `${subcategoryQueries} pending sub-category admin quer${subcategoryQueries === 1 ? 'y' : 'ies'}`,
                    href: '/super-admin/queries',
                    count: subcategoryQueries,
                    createdAt: latestSub,
                },
            ]);
        }
        async forAdsAdmin() {
            return { totalCount: 0, items: [] };
        }
    };
    return AdminActionItemsService = _classThis;
})();
exports.AdminActionItemsService = AdminActionItemsService;
//# sourceMappingURL=admin-action-items.service.js.map