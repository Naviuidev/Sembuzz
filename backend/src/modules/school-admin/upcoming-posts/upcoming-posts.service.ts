import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUpcomingPostDto } from './dto/create-upcoming-post.dto';
import { UpdateUpcomingPostDto } from './dto/update-upcoming-post.dto';

/** Parse YYYY-MM-DD as a calendar date (noon UTC) so the stored DATE is correct in any server timezone. */
function parseDateOnly(isoDateStr: string): Date {
  const d = new Date(isoDateStr.trim() + 'T12:00:00.000Z');
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
  return d;
}

@Injectable()
export class UpcomingPostsService {
  constructor(private prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateUpcomingPostDto) {
    await this.validateCategorySubCategory(schoolId, dto.categoryId, dto.subCategoryId);
    const dateStr = dto.scheduledTo ?? dto.scheduledDate;
    if (!dateStr || typeof dateStr !== 'string') {
      throw new BadRequestException('scheduledTo or scheduledDate is required (ISO 8601 date, e.g. YYYY-MM-DD).');
    }
    const imageUrlsJson = dto.imageUrls?.length ? JSON.stringify(dto.imageUrls) : null;
    let scheduledTo: Date;
    try {
      scheduledTo = parseDateOnly(dateStr);
    } catch {
      throw new BadRequestException('scheduledTo must be a valid ISO 8601 date string (e.g. YYYY-MM-DD).');
    }
    try {
      return await this.prisma.upcomingPost.create({
        data: {
          schoolId,
          categoryId: dto.categoryId,
          subCategoryId: dto.subCategoryId,
          title: dto.title,
          description: dto.description ?? null,
          imageUrls: imageUrlsJson,
          scheduledTo,
        },
        include: {
          school: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true } },
          subCategory: { select: { id: true, name: true } },
        },
      });
    } catch (e) {
      const errMsg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : '';
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        const msg = (e.meta?.message ?? e.message) as string;
        if (e.code === 'P2002') throw new BadRequestException('A post with this data already exists.');
        if (e.code === 'P2003' || /scheduledDate|scheduledTo|column|field list/i.test(msg)) {
          throw new BadRequestException(
            'Database schema may be out of date. Run: npx prisma migrate deploy (from backend folder with MySQL running).',
          );
        }
      }
      if (/scheduledDate|scheduledTo|Unknown column|doesn't have a default/i.test(errMsg)) {
        throw new BadRequestException(
          'Database schema may be out of date. Run: npx prisma migrate deploy (from backend folder with MySQL running).',
        );
      }
      throw e;
    }
  }

  async findAllForSchool(schoolId: string) {
    return this.prisma.upcomingPost.findMany({
      where: { schoolId },
      include: {
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
      },
      orderBy: [{ scheduledTo: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, schoolId: string) {
    const post = await this.prisma.upcomingPost.findFirst({
      where: { id, schoolId },
      include: {
        school: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
      },
    });
    if (!post) throw new NotFoundException('Upcoming post not found');
    return post;
  }

  async update(id: string, schoolId: string, dto: UpdateUpcomingPostDto) {
    const existing = await this.prisma.upcomingPost.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Upcoming post not found');
    if (dto.categoryId != null || dto.subCategoryId != null) {
      await this.validateCategorySubCategory(
        schoolId,
        dto.categoryId ?? existing.categoryId,
        dto.subCategoryId ?? existing.subCategoryId,
      );
    }
    const data: Parameters<typeof this.prisma.upcomingPost.update>[0]['data'] = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.subCategoryId !== undefined) data.subCategoryId = dto.subCategoryId;
    if (dto.imageUrls !== undefined) {
      data.imageUrls = dto.imageUrls?.length ? JSON.stringify(dto.imageUrls) : null;
    }
    if (dto.scheduledTo !== undefined) {
      try {
        data.scheduledTo = parseDateOnly(dto.scheduledTo);
      } catch {
        throw new BadRequestException('scheduledTo must be a valid ISO 8601 date string (e.g. YYYY-MM-DD).');
      }
    }
    return this.prisma.upcomingPost.update({
      where: { id },
      data,
      include: {
        school: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, schoolId: string) {
    const existing = await this.prisma.upcomingPost.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Upcoming post not found');
    await this.prisma.upcomingPost.delete({ where: { id } });
    return { deleted: true };
  }

  private async validateCategorySubCategory(schoolId: string, categoryId: string, subCategoryId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, schoolId },
      include: { subcategories: { where: { id: subCategoryId }, select: { id: true } } },
    });
    if (!cat) throw new BadRequestException('Category not found');
    if (!cat.subcategories.length) throw new BadRequestException('Subcategory not found or does not belong to category');
  }
}
