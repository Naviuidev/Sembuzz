import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class CategoryAdminBlogsService {
  constructor(private prisma: PrismaService) {}

  private async getCategoryAdminCategoryIds(categoryAdminId: string): Promise<string[]> {
    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { id: categoryAdminId },
      select: {
        categoryId: true,
        categories: { select: { categoryId: true } },
      },
    });
    if (!admin) return [];
    return [
      admin.categoryId,
      ...admin.categories.map((c) => c.categoryId),
    ].filter((id, i, arr) => arr.indexOf(id) === i);
  }

  private async ensureBlogAccess(blogId: string, categoryAdminId: string) {
    const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
    const blog = await this.prisma.blogPost.findFirst({
      where: { id: blogId, categoryId: { in: categoryIds } },
      include: {
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: { select: { id: true, name: true, email: true } },
      },
    });
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  /** DB column may exist before Prisma client types include `publishedAt` */
  private async setBlogPublishedAt(blogId: string, at: Date | null) {
    if (at) {
      await this.prisma.$executeRaw`
        UPDATE \`blog_posts\` SET \`publishedAt\` = ${at} WHERE \`id\` = ${blogId}
      `;
    } else {
      await this.prisma.$executeRaw`
        UPDATE \`blog_posts\` SET \`publishedAt\` = NULL WHERE \`id\` = ${blogId}
      `;
    }
  }

  async findPending(categoryAdminId: string) {
    const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
    if (categoryIds.length === 0) return [];
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
  async findApprovedForCategoryAdmin(categoryAdminId: string) {
    const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
    if (categoryIds.length === 0) return [];
    return this.prisma.blogPost.findMany({
      where: { categoryId: { in: categoryIds }, status: 'approved' },
      include: {
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(blogId: string, categoryAdminId: string, dto: UpdateBlogDto) {
    await this.ensureBlogAccess(blogId, categoryAdminId);
    const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== 'pending') {
      throw new ForbiddenException('Only pending blog posts can be edited');
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

  async revert(blogId: string, categoryAdminId: string, revertNotes: string) {
    await this.ensureBlogAccess(blogId, categoryAdminId);
    const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== 'pending') {
      throw new ForbiddenException('Only pending blog posts can be sent back for suggestions');
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

  async reject(blogId: string, categoryAdminId: string, rejectNotes: string) {
    await this.ensureBlogAccess(blogId, categoryAdminId);
    const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== 'pending') {
      throw new ForbiddenException('Only pending blog posts can be rejected');
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
  async approve(blogId: string, categoryAdminId: string) {
    await this.ensureBlogAccess(blogId, categoryAdminId);
    const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== 'pending') {
      throw new ForbiddenException('Only pending blog posts can be approved');
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
  async publishDraft(blogId: string, categoryAdminId: string) {
    await this.ensureBlogAccess(blogId, categoryAdminId);
    const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== 'approved' || blog.published) {
      throw new ForbiddenException('Only approved drafts can be published');
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
  async removeApproved(blogId: string, categoryAdminId: string) {
    await this.ensureBlogAccess(blogId, categoryAdminId);
    const blog = await this.prisma.blogPost.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== 'approved') {
      throw new ForbiddenException('Only approved blogs can be deleted here');
    }
    await this.prisma.blogPost.delete({ where: { id: blogId } });
    return { ok: true };
  }
}
