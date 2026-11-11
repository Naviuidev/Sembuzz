import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  blocksHaveText,
  clipForMysqlText,
  extractTextFromBlocks,
  sanitizeContentBlocks,
} from '../../subcategory-admin/blogs/blog-blocks.util';
import { CreateMasterAdminBlogDto, UpdateMasterAdminBlogDto } from './dto/create-master-admin-blog.dto';

const blogDetailSelect = {
  id: true,
  schoolId: true,
  categoryId: true,
  subCategoryId: true,
  title: true,
  content: true,
  coverImageUrl: true,
  imageUrls: true,
  heroTitle: true,
  heroParagraph: true,
  heroButtonText: true,
  heroButtonLink: true,
  contentBlocks: true,
  status: true,
  published: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  subCategory: {
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
    },
  },
  school: { select: { id: true, name: true } },
} as const;

@Injectable()
export class MasterAdminBlogsService {
  constructor(private prisma: PrismaService) {}

  private async assertSchoolSubCategory(schoolId: string, subCategoryId: string) {
    const sub = await this.prisma.subCategory.findFirst({
      where: { id: subCategoryId, category: { schoolId } },
      include: { category: { select: { id: true, schoolId: true } } },
    });
    if (!sub) {
      throw new BadRequestException('Invalid subcategory for this school.');
    }
    return { subCategory: sub, categoryId: sub.category.id };
  }

  private async resolveSubCategoryAdminId(schoolId: string, subCategoryId: string): Promise<string> {
    const scoped = await this.prisma.subCategoryAdmin.findFirst({
      where: {
        schoolId,
        isActive: true,
        OR: [{ subCategoryId }, { subCategories: { some: { subCategoryId } } }],
      },
      orderBy: { createdAt: 'asc' },
    });
    if (scoped) return scoped.id;

    const anyForSchool = await this.prisma.subCategoryAdmin.findFirst({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (anyForSchool) return anyForSchool.id;

    throw new BadRequestException(
      'No active subcategory admin for this school. Assign one under Users/Categories first.',
    );
  }

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

  private buildBlogContent(dto: { title: string; content?: string; contentBlocks?: unknown }) {
    const blocks = sanitizeContentBlocks(Array.isArray(dto.contentBlocks) ? dto.contentBlocks : null);
    const body = (dto.content ?? '').trim();
    if (!blocksHaveText(blocks) && !body) {
      throw new BadRequestException(
        'Add at least one text block (heading, paragraph, or heading + paragraph) or write listing summary text.',
      );
    }
    const rawContent = body || extractTextFromBlocks(blocks) || dto.title.trim();
    const content = clipForMysqlText(rawContent);
    const contentBlocksJson: object[] | undefined =
      blocks?.length ? (JSON.parse(JSON.stringify(blocks)) as object[]) : undefined;
    return { content, contentBlocksJson };
  }

  async getOne(blogId: string, schoolId: string) {
    const blog = await this.prisma.blogPost.findFirst({
      where: { id: blogId, schoolId },
      select: blogDetailSelect,
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async create(dto: CreateMasterAdminBlogDto) {
    const { categoryId } = await this.assertSchoolSubCategory(dto.schoolId, dto.subCategoryId);
    const subCategoryAdminId = await this.resolveSubCategoryAdminId(dto.schoolId, dto.subCategoryId);
    const { content, contentBlocksJson } = this.buildBlogContent(dto);

    try {
      return await this.prisma.blogPost.create({
        data: {
          subCategoryAdminId,
          subCategoryId: dto.subCategoryId,
          categoryId,
          schoolId: dto.schoolId,
          title: dto.title.trim(),
          content,
          coverImageUrl: dto.coverImageUrl?.trim() || null,
          imageUrls: dto.imageUrls?.length ? JSON.stringify(dto.imageUrls) : null,
          heroTitle: dto.heroTitle?.trim().slice(0, 300) || null,
          heroParagraph: dto.heroParagraph?.trim() || null,
          heroButtonText: dto.heroButtonText?.trim().slice(0, 120) || null,
          heroButtonLink: dto.heroButtonLink?.trim().slice(0, 2048) || null,
          contentBlocks: contentBlocksJson ?? undefined,
          status: 'approved',
          published: false,
          publishedAt: null,
        },
        select: blogDetailSelect,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new BadRequestException('Invalid subcategory for this school.');
      }
      throw e;
    }
  }

  async update(blogId: string, schoolId: string, dto: UpdateMasterAdminBlogDto) {
    const existing = await this.prisma.blogPost.findFirst({ where: { id: blogId, schoolId } });
    if (!existing) throw new NotFoundException('Blog not found');

    const title = dto.title?.trim() ?? existing.title;
    const contentInput = {
      title,
      content: dto.content ?? existing.content,
      contentBlocks: dto.contentBlocks !== undefined ? dto.contentBlocks : existing.contentBlocks,
    };
    const { content, contentBlocksJson } = this.buildBlogContent(contentInput);

    const now = new Date();

    return this.prisma.blogPost.update({
      where: { id: blogId },
      data: {
        title,
        content,
        coverImageUrl:
          dto.coverImageUrl !== undefined ? dto.coverImageUrl?.trim() || null : existing.coverImageUrl,
        heroTitle: dto.heroTitle !== undefined ? dto.heroTitle?.trim().slice(0, 300) || null : existing.heroTitle,
        heroParagraph: dto.heroParagraph !== undefined ? dto.heroParagraph?.trim() || null : existing.heroParagraph,
        heroButtonText:
          dto.heroButtonText !== undefined ? dto.heroButtonText?.trim().slice(0, 120) || null : existing.heroButtonText,
        heroButtonLink:
          dto.heroButtonLink !== undefined ? dto.heroButtonLink?.trim().slice(0, 2048) || null : existing.heroButtonLink,
        contentBlocks: dto.contentBlocks !== undefined ? contentBlocksJson ?? Prisma.DbNull : undefined,
        status: 'approved',
        ...(dto.publish === true
          ? { published: true, publishedAt: existing.publishedAt ?? now }
          : {}),
      },
      select: blogDetailSelect,
    });
  }

  async publish(blogId: string, schoolId: string) {
    const existing = await this.prisma.blogPost.findFirst({ where: { id: blogId, schoolId } });
    if (!existing) throw new NotFoundException('Blog not found');
    if (existing.status === 'rejected') {
      throw new BadRequestException('Rejected blogs cannot be published.');
    }
    if (existing.published) {
      return this.getOne(blogId, schoolId);
    }

    await this.prisma.blogPost.update({
      where: { id: blogId },
      data: {
        status: 'approved',
        published: true,
      },
    });
    await this.setBlogPublishedAt(blogId, new Date());
    return this.getOne(blogId, schoolId);
  }
}
