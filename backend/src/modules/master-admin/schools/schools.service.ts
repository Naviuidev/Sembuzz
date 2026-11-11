import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { MasterAdminJwtPayload } from '../types/master-admin-jwt.types';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  EVENT_PUBLIC_STATUSES,
  EVENT_SCHEDULED_STATUSES,
  EVENT_STATUS,
} from '../../events/event-publishing.constants';

const MASTER_ADMIN_POST_STATUSES = [
  ...EVENT_PUBLIC_STATUSES,
  ...EVENT_SCHEDULED_STATUSES,
  'pending',
  'draft',
] as const;

const adminSelect = { id: true, name: true, email: true, isActive: true } as const;

function uniqueAdmins<T extends { id: string }>(admins: T[]): T[] {
  const seen = new Set<string>();
  return admins.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

@Injectable()
export class MasterAdminSchoolsService {
  constructor(private prisma: PrismaService) {}

  private assertSchoolScope(actor: MasterAdminJwtPayload | undefined, schoolId: string) {
    if (actor?.role === 'school_master_admin' && actor.schoolId !== schoolId) {
      throw new ForbiddenException('You do not have access to this school');
    }
  }

  list(actor?: MasterAdminJwtPayload) {
    const schoolSelect = {
      id: true,
      refNum: true,
      name: true,
      image: true,
      city: true,
      state: true,
      isActive: true,
    } as const;

    if (actor?.role === 'school_master_admin' && actor.schoolId) {
      return this.prisma.school.findMany({
        where: { id: actor.schoolId },
        orderBy: { name: 'asc' },
        select: schoolSelect,
      });
    }

    return this.prisma.school.findMany({
      orderBy: { name: 'asc' },
      select: schoolSelect,
    });
  }

  async getOverview(schoolId: string, actor?: MasterAdminJwtPayload) {
    this.assertSchoolScope(actor, schoolId);
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        refNum: true,
        name: true,
        image: true,
        country: true,
        state: true,
        city: true,
        domain: true,
        tenure: true,
        isActive: true,
        filtersVisibility: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const [
      schoolAdmins,
      schoolFeatures,
      adsAdmins,
      categories,
      postCount,
      clubCount,
      clubs,
      socialAccounts,
      directMessaging,
      userCount,
      bannerAdCount,
      sponsoredAdCount,
      blogCount,
      upcomingCount,
    ] = await Promise.all([
      this.prisma.schoolAdmin.findMany({
        where: { schoolId },
        select: adminSelect,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.schoolFeature.findMany({
        where: { schoolId, isEnabled: true },
        include: { feature: { select: { code: true, name: true } } },
      }),
      this.prisma.adsAdmin.findMany({
        where: { schoolId },
        select: adminSelect,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.category.findMany({
        where: { schoolId },
        orderBy: { name: 'asc' },
        include: {
          categoryAdmins: { select: adminSelect },
          categoryAdminCategories: {
            include: { categoryAdmin: { select: adminSelect } },
          },
          subcategories: {
            orderBy: { name: 'asc' },
            include: {
              subCategoryAdmins: { select: adminSelect },
              subCategoryAdminSubCategories: {
                include: { subCategoryAdmin: { select: adminSelect } },
              },
            },
          },
        },
      }),
      this.prisma.event.count({ where: { schoolId } }),
      this.prisma.clubGroupChat.count({ where: { schoolId } }),
      this.prisma.clubGroupChat.findMany({
        where: { schoolId },
        orderBy: { pageName: 'asc' },
        select: { id: true, pageName: true, icon: true, isEnabled: true, messageMode: true },
      }),
      this.prisma.schoolSocialAccount.findMany({
        where: { schoolId },
        orderBy: { platformName: 'asc' },
        select: { id: true, platformName: true, pageName: true, link: true, icon: true },
      }),
      this.prisma.schoolDirectMessagingSetting.findUnique({
        where: { schoolId },
        select: { isEnabled: true },
      }),
      this.prisma.user.count({ where: { schoolId } }),
      this.prisma.bannerAd.count({ where: { schoolId } }),
      this.prisma.sponsoredAd.count({ where: { schoolId } }),
      this.prisma.blogPost.count({ where: { schoolId } }),
      this.prisma.upcomingPost.count({ where: { schoolId } }),
    ]);

    const enabledFeatures = schoolFeatures.map((sf) => ({
      code: sf.feature.code,
      name: sf.feature.name,
    }));

    const categoryTree = categories.map((category) => ({
      id: category.id,
      name: category.name,
      admins: uniqueAdmins([
        ...category.categoryAdmins,
        ...category.categoryAdminCategories.map((link) => link.categoryAdmin),
      ]),
      subcategories: category.subcategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        admins: uniqueAdmins([
          ...sub.subCategoryAdmins,
          ...sub.subCategoryAdminSubCategories.map((link) => link.subCategoryAdmin),
        ]),
      })),
    }));

    const subcategoryCount = categoryTree.reduce((n, c) => n + c.subcategories.length, 0);

    const postCountRows = await this.prisma.event.groupBy({
      by: ['subCategoryId'],
      where: {
        schoolId,
        status: { in: [...MASTER_ADMIN_POST_STATUSES] },
      },
      _count: { id: true },
    });
    const postCountBySub = new Map(postCountRows.map((r) => [r.subCategoryId, r._count.id]));

    const categoriesWithCounts = categoryTree.map((category) => ({
      ...category,
      subcategories: category.subcategories.map((sub) => ({
        ...sub,
        postCount: postCountBySub.get(sub.id) ?? 0,
      })),
    }));

    return {
      school,
      enabledFeatures,
      schoolAdmins,
      adsAdmins,
      categories: categoriesWithCounts,
      counts: {
        posts: postCount,
        clubs: clubCount,
        categories: categoryTree.length,
        subcategories: subcategoryCount,
        users: userCount,
        bannerAds: bannerAdCount,
        sponsoredAds: sponsoredAdCount,
        blogs: blogCount,
        upcoming: upcomingCount,
      },
      clubs,
      socialAccounts,
      directMessaging: directMessaging ?? { isEnabled: true },
    };
  }

  async listPosts(schoolId: string, actor?: MasterAdminJwtPayload) {
    await this.assertSchoolExists(schoolId, actor);
    return this.prisma.event.findMany({
      where: {
        schoolId,
        status: { in: [...MASTER_ADMIN_POST_STATUSES] },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        publishAt: true,
        createdAt: true,
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        subCategoryAdmin: { select: { name: true, email: true } },
        schoolAdmin: { select: { name: true, email: true } },
      },
    });
  }

  async getPost(schoolId: string, postId: string, actor?: MasterAdminJwtPayload) {
    await this.assertSchoolExists(schoolId, actor);
    const event = await this.prisma.event.findFirst({
      where: { id: postId, schoolId },
      include: {
        school: { select: { name: true, image: true } },
        subCategory: { select: { id: true, name: true } },
      },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    return event;
  }

  async listUsers(schoolId: string, actor?: MasterAdminJwtPayload) {
    await this.assertSchoolExists(schoolId, actor);
    return this.prisma.user.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: {
        id: true,
        name: true,
        email: true,
        registrationMethod: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async listBlogs(schoolId: string, actor?: MasterAdminJwtPayload) {
    await this.assertSchoolExists(schoolId, actor);
    return this.prisma.blogPost.findMany({
      where: { schoolId },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        status: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: { select: { name: true, email: true } },
      },
    });
  }

  async listUpcoming(schoolId: string, actor?: MasterAdminJwtPayload) {
    await this.assertSchoolExists(schoolId, actor);
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const upcomingRowSelect = {
      id: true,
      title: true,
      description: true,
      imageUrls: true,
      scheduledTo: true,
      createdAt: true,
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      school: { select: { id: true, name: true, image: true } },
    } as const;

    const [upcomingPosts, scheduledEvents] = await Promise.all([
      this.prisma.upcomingPost.findMany({
        where: { schoolId, scheduledTo: { gte: startOfToday } },
        orderBy: [{ scheduledTo: 'asc' }, { createdAt: 'desc' }],
        select: upcomingRowSelect,
      }),
      this.prisma.event.findMany({
        where: {
          schoolId,
          status: EVENT_STATUS.SCHEDULED,
          publishAt: { gt: now },
        },
        orderBy: [{ publishAt: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          description: true,
          imageUrls: true,
          publishAt: true,
          createdAt: true,
          school: { select: { id: true, name: true, image: true } },
          subCategory: {
            select: {
              id: true,
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    const fromScheduledPosts = scheduledEvents
      .filter((e): e is typeof e & { publishAt: Date } => e.publishAt != null)
      .map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        imageUrls: e.imageUrls,
        scheduledTo: e.publishAt,
        createdAt: e.createdAt,
        category: e.subCategory.category,
        subCategory: { id: e.subCategory.id, name: e.subCategory.name },
        school: e.school,
      }));

    return [...upcomingPosts, ...fromScheduledPosts].sort((a, b) => {
      const bySchedule = a.scheduledTo.getTime() - b.scheduledTo.getTime();
      if (bySchedule !== 0) return bySchedule;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async listBannerAds(schoolId: string, actor?: MasterAdminJwtPayload) {
    await this.assertSchoolExists(schoolId, actor);
    return this.prisma.bannerAd.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        imageUrl: true,
        externalLink: true,
        startAt: true,
        endAt: true,
        createdAt: true,
        categoryAdmin: {
          select: {
            name: true,
            email: true,
            category: { select: { name: true } },
          },
        },
        adsAdmin: { select: { name: true, email: true } },
      },
    });
  }

  async getPrivacy(schoolId: string, actor?: MasterAdminJwtPayload) {
    await this.assertSchoolExists(schoolId, actor);

    const [
      schoolFeatures,
      schoolAdmins,
      categoryAdmins,
      subCategoryAdmins,
      adsAdmins,
      emailChangeRequests,
    ] = await Promise.all([
      this.prisma.schoolFeature.findMany({
        where: { schoolId, isEnabled: true },
        include: { feature: { select: { code: true, name: true } } },
      }),
      this.prisma.schoolAdmin.findMany({
        where: { schoolId },
        select: {
          id: true,
          platformUserId: true,
          name: true,
          email: true,
          isActive: true,
          isFirstLogin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.categoryAdmin.findMany({
        where: { schoolId },
        include: {
          category: { select: { id: true, name: true } },
          categories: {
            include: { category: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subCategoryAdmin.findMany({
        where: { schoolId },
        include: {
          category: { select: { id: true, name: true } },
          subCategory: { select: { id: true, name: true } },
          subCategories: {
            include: { subCategory: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adsAdmin.findMany({
        where: { schoolId },
        select: {
          id: true,
          platformUserId: true,
          name: true,
          email: true,
          isActive: true,
          isFirstLogin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminEmailChangeRequest.findMany({
        where: {
          schoolId,
          status: { in: ['pending', 'pending_otp', 'pending_new_email_otp'] },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          targetRole: true,
          targetName: true,
          targetEmail: true,
          initiatedByRole: true,
          initiatedByName: true,
          reason: true,
          status: true,
          proposedNewEmail: true,
          createdAt: true,
        },
      }),
    ]);

    const mapCategoryAdmin = (admin: (typeof categoryAdmins)[number]) => {
      const names = uniqueAdmins([
        ...(admin.categories?.map((link) => ({ id: link.category.id, name: link.category.name })) ?? []),
        ...(admin.category ? [{ id: admin.category.id, name: admin.category.name }] : []),
      ]);
      return {
        id: admin.id,
        platformUserId: admin.platformUserId,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        isFirstLogin: admin.isFirstLogin,
        scope: names.map((n) => n.name).join(', ') || '—',
        createdAt: admin.createdAt,
      };
    };

    const mapSubCategoryAdmin = (admin: (typeof subCategoryAdmins)[number]) => {
      const subNames =
        admin.subCategories?.map((link) => link.subCategory.name).filter(Boolean) ??
        [];
      const scope =
        subNames.length > 0
          ? subNames.join(', ')
          : [admin.category?.name, admin.subCategory?.name].filter(Boolean).join(' · ') || '—';
      return {
        id: admin.id,
        platformUserId: admin.platformUserId,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        isFirstLogin: admin.isFirstLogin,
        scope,
        createdAt: admin.createdAt,
      };
    };

    return {
      enabledFeatures: schoolFeatures.map((sf) => ({
        code: sf.feature.code,
        name: sf.feature.name,
      })),
      schoolAdmins: schoolAdmins.map((a) => ({
        id: a.id,
        platformUserId: a.platformUserId,
        name: a.name,
        email: a.email,
        isActive: a.isActive,
        isFirstLogin: a.isFirstLogin,
        scope: 'School',
        createdAt: a.createdAt,
      })),
      categoryAdmins: categoryAdmins.map(mapCategoryAdmin),
      subCategoryAdmins: subCategoryAdmins.map(mapSubCategoryAdmin),
      adsAdmins: adsAdmins.map((a) => ({
        id: a.id,
        platformUserId: a.platformUserId,
        name: a.name,
        email: a.email,
        isActive: a.isActive,
        isFirstLogin: a.isFirstLogin,
        scope: 'Ads',
        createdAt: a.createdAt,
      })),
      emailChangeRequests,
    };
  }

  async listSponsoredAds(schoolId: string, actor?: MasterAdminJwtPayload) {
    await this.assertSchoolExists(schoolId, actor);
    return this.prisma.sponsoredAd.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        externalLink: true,
        startAt: true,
        endAt: true,
        createdAt: true,
        categoryAdmin: {
          select: {
            name: true,
            email: true,
            category: { select: { name: true } },
          },
        },
        adsAdmin: { select: { name: true, email: true } },
      },
    });
  }

  private async assertSchoolExists(schoolId: string, actor?: MasterAdminJwtPayload) {
    this.assertSchoolScope(actor, schoolId);
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
  }
}
