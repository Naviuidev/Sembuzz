import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import {
  sanitizeContentBlocks,
  blocksHaveText,
  extractTextFromBlocks,
  clipForMysqlText,
} from './blog-blocks.util';

const BLOG_MIGRATE_HINT =
  'Run from the backend folder: npx prisma migrate deploy  (then restart the API)';

@Injectable()
export class SubCategoryAdminBlogsService {
  private readonly logger = new Logger(SubCategoryAdminBlogsService.name);

  constructor(private prisma: PrismaService) {}

  private async ensureSubCategoryForAdmin(
    subCategoryAdminId: string,
    subCategoryId: string,
  ): Promise<void> {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      select: {
        subCategoryId: true,
        subCategories: { select: { subCategoryId: true } },
      },
    });
    if (!admin) throw new ForbiddenException('Subcategory admin not found');
    const allowed = new Set([
      admin.subCategoryId,
      ...admin.subCategories.map((s) => s.subCategoryId),
    ]);
    if (!allowed.has(subCategoryId)) {
      throw new BadRequestException(
        'Invalid subcategory. Pick a subcategory you manage.',
      );
    }
  }

  async create(subCategoryAdminId: string, dto: CreateBlogDto) {
    await this.ensureSubCategoryForAdmin(subCategoryAdminId, dto.subCategoryId);
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      select: { categoryId: true, schoolId: true },
    });
    if (!admin) throw new ForbiddenException('Subcategory admin not found');
    const imageUrlsJson =
      dto.imageUrls?.length ? JSON.stringify(dto.imageUrls) : null;
    const blocks = sanitizeContentBlocks(
      Array.isArray(dto.contentBlocks) ? dto.contentBlocks : null,
    );
    const body = (dto.content ?? '').trim();
    if (!blocksHaveText(blocks) && !body) {
      throw new BadRequestException(
        'Add at least one text block (heading, paragraph, or heading + paragraph) or write body text.',
      );
    }
    const rawContent =
      body ||
      extractTextFromBlocks(blocks) ||
      dto.title.trim();
    /** Full article lives in contentBlocks; this column is listing/search only. */
    const content = clipForMysqlText(rawContent);
    let contentBlocksJson: object[] | undefined =
      blocks?.length ? (JSON.parse(JSON.stringify(blocks)) as object[]) : undefined;
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
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2003') {
          throw new BadRequestException('Invalid subcategory.');
        }
        if (e.code === 'P2000') {
          throw new BadRequestException(
            'Content is too long for one database field. Try shorter paragraphs or run the latest DB migration (contentBlocks column).',
          );
        }
        // Table missing in DB
        if (e.code === 'P2021' || e.code === 'P2010') {
          throw new BadRequestException(`Blog storage is not set up. ${BLOG_MIGRATE_HINT}`);
        }
      }
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Blog create failed: ${msg}`, e instanceof Error ? e.stack : undefined);
      if (
        msg.includes('blog_posts') &&
        (msg.includes("doesn't exist") ||
          msg.includes('does not exist') ||
          msg.includes('Unknown table'))
      ) {
        throw new BadRequestException(`Blog table missing. ${BLOG_MIGRATE_HINT}`);
      }
      if (msg.includes('Too long') || msg.includes('Data too long')) {
        throw new BadRequestException(
          'A field is too long (e.g. image URL). Shorten title or use smaller images.',
        );
      }
      throw new BadRequestException(
        process.env.NODE_ENV === 'production'
          ? 'Could not save the blog. Check that the database is migrated and try again.'
          : msg,
      );
    }
  }

  async findPending(subCategoryAdminId: string) {
    return this.prisma.blogPost.findMany({
      where: { subCategoryAdminId, status: 'pending' },
      include: { subCategory: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReverted(subCategoryAdminId: string) {
    return this.prisma.blogPost.findMany({
      where: { subCategoryAdminId, status: 'reverted' },
      include: { subCategory: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findRejected(subCategoryAdminId: string) {
    return this.prisma.blogPost.findMany({
      where: { subCategoryAdminId, status: 'rejected' },
      include: { subCategory: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findApproved(subCategoryAdminId: string) {
    return this.prisma.blogPost.findMany({
      where: { subCategoryAdminId, status: 'approved' },
      include: { subCategory: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
