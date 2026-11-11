import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EVENT_PUBLIC_STATUSES } from '../../events/event-publishing.constants';
import { MASTER_ADMIN_POST_STATUSES } from '../posts/posts.constants';
import type { MasterAdminJwtPayload } from '../types/master-admin-jwt.types';

@Injectable()
export class MasterAdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(actor?: MasterAdminJwtPayload) {
    const schoolFilter =
      actor?.role === 'school_master_admin' && actor.schoolId
        ? { schoolId: actor.schoolId }
        : undefined;

    const [
      schoolTotal,
      schoolActive,
      users,
      postsTotal,
      postsPending,
      postsPublished,
      blogsTotal,
      blogSavedDrafts,
      upcoming,
      pipelinePending,
      postRequestsPending,
      recentSchools,
    ] = await Promise.all([
      schoolFilter
        ? this.prisma.school.count({ where: { id: actor!.schoolId! } })
        : this.prisma.school.count(),
      schoolFilter
        ? this.prisma.school.count({ where: { id: actor!.schoolId!, isActive: true } })
        : this.prisma.school.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: schoolFilter }),
      this.prisma.event.count({
        where: { ...schoolFilter, status: { in: [...MASTER_ADMIN_POST_STATUSES] } },
      }),
      this.prisma.event.count({ where: { ...schoolFilter, status: 'pending' } }),
      this.prisma.event.count({
        where: { ...schoolFilter, status: { in: [...EVENT_PUBLIC_STATUSES] } },
      }),
      this.prisma.blogPost.count({ where: schoolFilter }),
      this.prisma.blogPost.count({
        where: { ...schoolFilter, published: false, status: { not: 'rejected' } },
      }),
      this.prisma.upcomingPost.count({ where: schoolFilter }),
      this.prisma.externalCategorySchoolPipelineRequest.count({
        where: { ...schoolFilter, status: 'pending' },
      }),
      this.prisma.externalSchoolPostRequest.count({
        where: { ...schoolFilter, status: 'pending' },
      }),
      schoolFilter
        ? this.prisma.school.findMany({
            where: { id: actor!.schoolId! },
            select: {
              id: true,
              refNum: true,
              name: true,
              image: true,
              city: true,
              state: true,
              isActive: true,
            },
          })
        : this.prisma.school.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 8,
            select: {
              id: true,
              refNum: true,
              name: true,
              image: true,
              city: true,
              state: true,
              isActive: true,
            },
          }),
    ]);

    return {
      schools: {
        total: schoolTotal,
        active: schoolActive,
        inactive: schoolTotal - schoolActive,
      },
      users,
      posts: {
        total: postsTotal,
        pending: postsPending,
        published: postsPublished,
      },
      blogs: {
        total: blogsTotal,
        savedDrafts: blogSavedDrafts,
      },
      upcoming,
      external: {
        pipelinePending,
        postRequestsPending,
        pendingTotal: pipelinePending + postRequestsPending,
      },
      recentSchools,
    };
  }
}
