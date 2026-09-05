import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSchoolAdminPostDto } from './dto/create-post.dto';
import {
  EVENT_STATUS,
  parsePublishAt,
  resolveSchoolAdminCreateStatus,
} from '../../events/event-publishing.constants';
import { PushNotificationService } from '../../push/push-notification.service';

@Injectable()
export class SchoolAdminPostsService {
  constructor(
    private prisma: PrismaService,
    private pushNotifications: PushNotificationService,
  ) {}

  async create(schoolAdminId: string, schoolId: string, dto: CreateSchoolAdminPostDto) {
    await this.validateCategorySubCategory(schoolId, dto.categoryId, dto.subCategoryId);
    const publishAt = parsePublishAt(dto.publishAt);
    if (dto.publishAt && !publishAt) {
      throw new BadRequestException('publishAt must be a valid ISO 8601 datetime.');
    }
    const now = new Date();
    const { status, publishedAt } = resolveSchoolAdminCreateStatus(publishAt, now);
    const imageUrlsJson = dto.imageUrls?.length ? JSON.stringify(dto.imageUrls) : null;

    try {
      const created = await this.prisma.event.create({
        data: {
          schoolAdminId,
          subCategoryId: dto.subCategoryId,
          categoryId: dto.categoryId,
          schoolId,
          title: dto.title.trim(),
          description: dto.description ?? null,
          externalLink: dto.externalLink ?? null,
          commentsEnabled: dto.commentsEnabled ?? true,
          imageUrls: imageUrlsJson,
          status,
          publishAt,
          publishedAt,
        },
        include: {
          subCategory: {
            select: {
              id: true,
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
          schoolAdmin: { select: { id: true, name: true, email: true } },
        },
      });

      if (status === EVENT_STATUS.PUBLISHED) {
        void this.pushNotifications
          .notifyUsersForApprovedEvent({
            id: created.id,
            schoolId: created.schoolId,
            subCategoryId: created.subCategoryId,
            title: created.title,
          })
          .catch(() => undefined);
      }

      return created;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new BadRequestException('Invalid category or subcategory for this school.');
      }
      throw e;
    }
  }

  async findAllForSchool(schoolId: string) {
    return this.prisma.event.findMany({
      where: { schoolId },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        subCategoryAdmin: {
          select: { id: true, name: true, email: true },
        },
        schoolAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, schoolId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, schoolId },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        subCategoryAdmin: {
          select: { id: true, name: true, email: true },
        },
        schoolAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    return event;
  }

  async cancelScheduled(id: string, schoolId: string) {
    const event = await this.prisma.event.findFirst({ where: { id, schoolId } });
    if (!event) throw new NotFoundException('Post not found');
    if (event.status !== EVENT_STATUS.SCHEDULED) {
      throw new BadRequestException('Only scheduled posts can be cancelled.');
    }
    return this.prisma.event.update({
      where: { id },
      data: { status: EVENT_STATUS.CANCELLED },
    });
  }

  async delete(id: string, schoolId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, schoolId },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    await this.prisma.event.delete({ where: { id } });
    return { deleted: true };
  }

  async update(
    id: string,
    schoolId: string,
    data: {
      title?: string;
      description?: string;
      externalLink?: string;
      commentsEnabled?: boolean;
      imageUrls?: string[];
      publishAt?: string;
    },
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id, schoolId },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    if (event.status === EVENT_STATUS.PUBLISHED) {
      throw new BadRequestException('Published posts cannot be rescheduled from here.');
    }
    if (event.status !== EVENT_STATUS.SCHEDULED && event.schoolAdminId) {
      throw new BadRequestException('Only scheduled school-admin posts can be edited.');
    }

    const updateData: {
      title?: string;
      description?: string;
      externalLink?: string | null;
      commentsEnabled?: boolean;
      imageUrls?: string | null;
      publishAt?: Date;
    } = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.externalLink !== undefined) updateData.externalLink = data.externalLink || null;
    if (data.commentsEnabled !== undefined) updateData.commentsEnabled = data.commentsEnabled;
    if (data.imageUrls !== undefined) {
      const arr = Array.isArray(data.imageUrls) ? data.imageUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
      updateData.imageUrls = arr.length > 0 ? JSON.stringify(arr) : null;
    }
    if (data.publishAt !== undefined) {
      const publishAt = parsePublishAt(data.publishAt);
      if (!publishAt) throw new BadRequestException('publishAt must be a valid ISO 8601 datetime.');
      updateData.publishAt = publishAt;
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        subCategoryAdmin: {
          select: { id: true, name: true, email: true },
        },
        schoolAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return updated;
  }

  private async validateCategorySubCategory(schoolId: string, categoryId: string, subCategoryId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, schoolId },
      include: { subcategories: { where: { id: subCategoryId }, select: { id: true } } },
    });
    if (!cat) throw new BadRequestException('Category not found');
    if (!cat.subcategories.length) {
      throw new BadRequestException('Subcategory not found or does not belong to category');
    }
  }
}
