import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMasterAdminPostDto } from './dto/create-master-admin-post.dto';
import { PublishMasterAdminPostDto } from './dto/publish-master-admin-post.dto';
import { UpdateMasterAdminPostDto } from './dto/update-master-admin-post.dto';
import { EVENT_STATUS, MASTER_ADMIN_POST_STATUSES } from './posts.constants';
import { parsePublishAt, resolveSchoolAdminCreateStatus } from '../../events/event-publishing.constants';
import {
  normalizeEventLocation,
  parseEventDateYmd,
  parseEventTimeHm,
  serializeActionButtons,
} from '../../events/event-post-fields.util';
import { PushNotificationService } from '../../push/push-notification.service';

const postListSelect = {
  id: true,
  title: true,
  imageUrls: true,
  status: true,
  publishedAt: true,
  publishAt: true,
  createdAt: true,
  schoolId: true,
  school: { select: { id: true, name: true } },
  subCategory: {
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
    },
  },
  subCategoryAdmin: { select: { name: true, email: true } },
  schoolAdmin: { select: { name: true, email: true } },
} as const;

@Injectable()
export class MasterAdminPostsService {
  constructor(
    private prisma: PrismaService,
    private pushNotifications: PushNotificationService,
  ) {}

  list(schoolId?: string) {
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    return this.prisma.event.findMany({
      where: {
        ...(sid ? { schoolId: sid } : {}),
        status: { in: [...MASTER_ADMIN_POST_STATUSES] },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: postListSelect,
    });
  }

  getCategoriesForSchool(schoolId: string) {
    return this.prisma.category.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        subcategories: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
    });
  }

  private async validateCategorySubCategory(
    schoolId: string,
    categoryId: string,
    subCategoryId: string,
  ) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, schoolId },
      include: { subcategories: { where: { id: subCategoryId }, select: { id: true } } },
    });
    if (!cat || !cat.subcategories.length) {
      throw new BadRequestException('Invalid category or subcategory for this school.');
    }
  }

  async create(dto: CreateMasterAdminPostDto) {
    await this.validateCategorySubCategory(dto.schoolId, dto.categoryId, dto.subCategoryId);
    const imageUrlsJson = dto.imageUrls?.length ? JSON.stringify(dto.imageUrls) : null;
    const eventDate = parseEventDateYmd(dto.eventDate);
    const eventStartTime = parseEventTimeHm(dto.eventStartTime);
    const eventEndTime = parseEventTimeHm(dto.eventEndTime);
    const eventLocation = normalizeEventLocation(dto.eventLocation);
    const actionButtons = serializeActionButtons(dto.actionButtons);
    const publishAt = parsePublishAt(dto.publishAt);
    if (dto.publishAt && !publishAt) {
      throw new BadRequestException('publishAt must be a valid ISO 8601 datetime.');
    }
    const now = new Date();
    const { status, publishedAt } = resolveSchoolAdminCreateStatus(publishAt, now);

    try {
      const created = await this.prisma.event.create({
        data: {
          schoolId: dto.schoolId,
          subCategoryId: dto.subCategoryId,
          categoryId: dto.categoryId,
          title: dto.title.trim(),
          description: dto.description ?? null,
          externalLink: dto.externalLink ?? null,
          eventDate,
          eventStartTime,
          eventEndTime,
          eventLocation,
          actionButtons,
          commentsEnabled: dto.commentsEnabled ?? false,
          imageUrls: imageUrlsJson,
          status,
          publishAt,
          publishedAt,
        },
        select: postListSelect,
      });

      if (status === EVENT_STATUS.PUBLISHED) {
        void this.pushNotifications
          .notifyUsersForApprovedEvent({
            id: created.id,
            schoolId: created.schoolId,
            subCategoryId: created.subCategory.id,
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

  async getOne(postId: string, schoolId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: postId, schoolId },
      select: {
        id: true,
        schoolId: true,
        categoryId: true,
        subCategoryId: true,
        title: true,
        description: true,
        externalLink: true,
        eventDate: true,
        eventStartTime: true,
        eventEndTime: true,
        eventLocation: true,
        actionButtons: true,
        commentsEnabled: true,
        imageUrls: true,
        status: true,
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        school: { select: { id: true, name: true } },
      },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    return event;
  }

  async update(postId: string, dto: UpdateMasterAdminPostDto) {
    const event = await this.prisma.event.findFirst({
      where: { id: postId, schoolId: dto.schoolId },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }

    const imageUrlsJson =
      dto.imageUrls !== undefined
        ? dto.imageUrls?.length
          ? JSON.stringify(dto.imageUrls)
          : null
        : undefined;
    const eventDate =
      dto.eventDate !== undefined ? (dto.eventDate ? parseEventDateYmd(dto.eventDate) : null) : undefined;
    const eventStartTime =
      dto.eventStartTime !== undefined
        ? dto.eventStartTime
          ? parseEventTimeHm(dto.eventStartTime)
          : null
        : undefined;
    const eventEndTime =
      dto.eventEndTime !== undefined ? (dto.eventEndTime ? parseEventTimeHm(dto.eventEndTime) : null) : undefined;
    const eventLocation =
      dto.eventLocation !== undefined ? normalizeEventLocation(dto.eventLocation) : undefined;
    const actionButtons =
      dto.actionButtons !== undefined ? serializeActionButtons(dto.actionButtons) : undefined;

    return this.prisma.event.update({
      where: { id: postId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
        ...(dto.externalLink !== undefined ? { externalLink: dto.externalLink ?? null } : {}),
        ...(eventDate !== undefined ? { eventDate } : {}),
        ...(eventStartTime !== undefined ? { eventStartTime } : {}),
        ...(eventEndTime !== undefined ? { eventEndTime } : {}),
        ...(eventLocation !== undefined ? { eventLocation } : {}),
        ...(actionButtons !== undefined ? { actionButtons } : {}),
        ...(dto.commentsEnabled !== undefined ? { commentsEnabled: dto.commentsEnabled } : {}),
        ...(imageUrlsJson !== undefined ? { imageUrls: imageUrlsJson } : {}),
      },
      select: postListSelect,
    });
  }

  async delete(postId: string, schoolId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: postId, schoolId },
    });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    await this.prisma.event.delete({ where: { id: postId } });
    return { deleted: true };
  }

  async publish(postId: string, dto: PublishMasterAdminPostDto) {
    await this.validateCategorySubCategory(dto.schoolId, dto.categoryId, dto.subCategoryId);
    const event = await this.prisma.event.findUnique({ where: { id: postId } });
    if (!event) {
      throw new NotFoundException('Post not found');
    }
    if (event.schoolId !== dto.schoolId) {
      throw new BadRequestException('School does not match this post.');
    }
    if (event.categoryId !== dto.categoryId || event.subCategoryId !== dto.subCategoryId) {
      throw new BadRequestException('Category or subcategory does not match this post.');
    }
    const publishable = new Set<string>([EVENT_STATUS.DRAFT, EVENT_STATUS.PENDING, EVENT_STATUS.SCHEDULED]);
    if (!publishable.has(event.status)) {
      throw new BadRequestException('Only draft or pending posts can be published from Master Admin.');
    }

    const now = new Date();
    const updated = await this.prisma.event.update({
      where: { id: postId },
      data: {
        status: EVENT_STATUS.PUBLISHED,
        publishedAt: now,
        publishAt: event.publishAt && event.publishAt.getTime() > now.getTime() ? event.publishAt : null,
      },
      select: postListSelect,
    });

    void this.pushNotifications
      .notifyUsersForApprovedEvent({
        id: updated.id,
        schoolId: updated.schoolId,
        subCategoryId: updated.subCategory.id,
        title: updated.title,
      })
      .catch(() => undefined);

    return updated;
  }
}
