import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminActionItem, AdminActionItemsResponse } from './admin-action-items.types';

@Injectable()
export class AdminActionItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildResponse(items: AdminActionItem[]): AdminActionItemsResponse {
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

  private async latestCreatedAt(
    model: {
      findFirst: (args: {
        where: Record<string, unknown>;
        orderBy: { createdAt: 'desc' };
        select: { createdAt: true };
      }) => Promise<{ createdAt: Date } | null>;
    },
    where: Record<string, unknown>,
  ): Promise<string | undefined> {
    const row = await model.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return row?.createdAt.toISOString();
  }

  private async categoryIdsForAdmin(categoryAdminId: string): Promise<string[]> {
    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { id: categoryAdminId },
      select: { categoryId: true, categories: { select: { categoryId: true } } },
    });
    if (!admin) return [];
    return [admin.categoryId, ...admin.categories.map((c) => c.categoryId)].filter(
      (id, i, arr) => arr.indexOf(id) === i,
    );
  }

  async forSchoolAdmin(schoolId: string): Promise<AdminActionItemsResponse> {
    const [
      pendingUsers,
      chatRequests,
      categoryQueries,
      subcategoryQueries,
      userHelp,
      latestUser,
      latestChat,
      latestCatQ,
      latestSubQ,
      latestHelp,
    ] = await Promise.all([
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

  async forCategoryAdmin(categoryAdminId: string, schoolId: string): Promise<AdminActionItemsResponse> {
    const categoryIds = await this.categoryIdsForAdmin(categoryAdminId);
    const hasCategories = categoryIds.length > 0;
    const categoryFilter = hasCategories ? { categoryId: { in: categoryIds } } : null;

    const [
      pendingEvents,
      pendingBlogs,
      chatRequests,
      memberships,
      subcategoryQueries,
      schoolQueries,
      latestEvent,
      latestBlog,
      latestChat,
      latestMember,
      latestSubQ,
      latestSchoolQ,
    ] = await Promise.all([
      hasCategories
        ? this.prisma.event.count({ where: { ...categoryFilter!, status: 'pending' } })
        : 0,
      hasCategories
        ? this.prisma.blogPost.count({ where: { ...categoryFilter!, status: 'pending' } })
        : 0,
      this.prisma.clubGroupChatRequest.count({ where: { schoolId, status: 'pending' } }),
      this.prisma.clubGroupMembership.count({ where: { schoolId, status: 'pending' } }),
      hasCategories
        ? this.prisma.subCategoryAdminQuery.count({
            where: { status: 'pending', subCategoryAdmin: { categoryId: { in: categoryIds } } },
          })
        : 0,
      this.prisma.schoolAdminToCategoryAdminQuery.count({ where: { schoolId, status: 'pending' } }),
      hasCategories
        ? this.latestCreatedAt(this.prisma.event, { ...categoryFilter!, status: 'pending' })
        : undefined,
      hasCategories
        ? this.latestCreatedAt(this.prisma.blogPost, { ...categoryFilter!, status: 'pending' })
        : undefined,
      this.latestCreatedAt(this.prisma.clubGroupChatRequest, { schoolId, status: 'pending' }),
      this.latestCreatedAt(this.prisma.clubGroupMembership, { schoolId, status: 'pending' }),
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
        id: 'club-group-memberships',
        kind: 'club_group_memberships',
        title: 'Club join requests',
        summary: `${memberships} student${memberships === 1 ? '' : 's'} waiting to join a club chat`,
        href: '/category-admin/privacy?tab=messages',
        count: memberships,
        createdAt: latestMember,
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

  async forSubCategoryAdmin(subCategoryAdminId: string): Promise<AdminActionItemsResponse> {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      select: { schoolId: true, categoryId: true },
    });
    if (!admin) return { totalCount: 0, items: [] };

    const [
      revertedEvents,
      revertedBlogs,
      schoolQueries,
      categoryQueries,
      latestEvent,
      latestBlog,
      latestSchoolQ,
      latestCatQ,
    ] = await Promise.all([
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
    ]);

    return this.buildResponse([
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

  async forSuperAdmin(): Promise<AdminActionItemsResponse> {
    const [schoolQueries, categoryQueries, subcategoryQueries, latestSchool, latestCat, latestSub] =
      await Promise.all([
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

  async forAdsAdmin(): Promise<AdminActionItemsResponse> {
    return { totalCount: 0, items: [] };
  }
}
