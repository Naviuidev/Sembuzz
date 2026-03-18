import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class PublishedBlogsService {
  constructor(private prisma: PrismaService) {}

  async listPublishedBlogs(
    schoolId?: string,
    q?: string,
    fromStr?: string,
    toStr?: string,
    subCategoryIdsCsv?: string,
  ) {
    const subIds =
      typeof subCategoryIdsCsv === 'string' && subCategoryIdsCsv.trim()
        ? subCategoryIdsCsv.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    const dateOk = (s?: string) =>
      !!s && typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
    const hasRange = dateOk(fromStr) && dateOk(toStr);
    const fromD = hasRange ? new Date(fromStr!.trim() + 'T00:00:00.000Z') : null;
    const toD = hasRange ? new Date(toStr!.trim() + 'T23:59:59.999Z') : null;

    const andFilters: Prisma.BlogPostWhereInput[] = [];
    const term = typeof q === 'string' ? q.trim() : '';
    if (term) {
      andFilters.push({
        OR: [
          { title: { contains: term } },
          { content: { contains: term } },
        ],
      });
    }

    const baseWhere: Prisma.BlogPostWhereInput = {
      status: 'approved',
      ...(sid ? { schoolId: sid } : {}),
      ...(subIds.length ? { subCategoryId: { in: subIds } } : {}),
      ...(andFilters.length ? { AND: andFilters } : {}),
    };

    if (hasRange && fromD && toD) {
      const rangeFilter: Prisma.BlogPostWhereInput = {
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
    } as const;

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[PublishedBlogs] list query failed:', msg);
      if (
        msg.includes('publishedAt') ||
        msg.includes('Unknown column') ||
        msg.includes('does not exist')
      ) {
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
        } catch (e2) {
          console.error('[PublishedBlogs] list fallback failed:', e2);
        }
      }
      throw new HttpException(
        {
          statusCode: 500,
          message:
            'Could not load blogs. Ensure migrations are applied (npx prisma migrate deploy) and the blog_posts table exists.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPublishedBlogById(id: string) {
    const blog = await this.prisma.blogPost.findFirst({
      where: { id, status: 'approved' },
      include: {
        school: { select: { id: true, name: true, image: true } },
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: { select: { id: true, name: true } },
      },
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }
}
