import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApproveEventDto } from './dto/approve-event.dto';
import { PushNotificationService } from '../../push/push-notification.service';
import {
  EVENT_STATUS,
  EVENT_PUBLIC_STATUSES,
  EVENT_PENDING_APPROVAL_STATUSES,
  EVENT_APPROVED_LIST_STATUSES,
  parsePublishAt,
  resolveCategoryAdminApproveStatus,
} from '../../events/event-publishing.constants';

@Injectable()
export class CategoryAdminEventsService {
  constructor(
    private prisma: PrismaService,
    private pushNotifications: PushNotificationService,
  ) {}

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

  private async ensureEventAccess(eventId: string, categoryAdminId: string) {
    const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        categoryId: { in: categoryIds },
      },
      include: {
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: { select: { id: true, name: true, email: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async findPendingForCategoryAdmin(categoryAdminId: string) {
    const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
    if (categoryIds.length === 0) return [];

    return this.prisma.event.findMany({
      where: {
        categoryId: { in: categoryIds },
        status: { in: [...EVENT_PENDING_APPROVAL_STATUSES] },
      },
      include: {
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findApprovedForCategoryAdmin(categoryAdminId: string) {
    const categoryIds = await this.getCategoryAdminCategoryIds(categoryAdminId);
    if (categoryIds.length === 0) return [];

    return this.prisma.event.findMany({
      where: {
        categoryId: { in: categoryIds },
        status: { in: [...EVENT_APPROVED_LIST_STATUSES] },
      },
      include: {
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async delete(eventId: string, categoryAdminId: string) {
    await this.ensureEventAccess(eventId, categoryAdminId);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !(EVENT_PUBLIC_STATUSES as readonly string[]).includes(event.status)) {
      throw new ForbiddenException('Only published events can be deleted');
    }
    await this.prisma.event.delete({ where: { id: eventId } });
    return { deleted: true };
  }

  async update(eventId: string, categoryAdminId: string, dto: UpdateEventDto) {
    await this.ensureEventAccess(eventId, categoryAdminId);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !(EVENT_PENDING_APPROVAL_STATUSES as readonly string[]).includes(event.status)) {
      throw new ForbiddenException('Only pending events can be edited');
    }
    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.externalLink !== undefined && { externalLink: dto.externalLink }),
        ...(dto.commentsEnabled !== undefined && { commentsEnabled: dto.commentsEnabled }),
      },
      include: {
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async revert(eventId: string, categoryAdminId: string, revertNotes: string) {
    await this.ensureEventAccess(eventId, categoryAdminId);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !(EVENT_PENDING_APPROVAL_STATUSES as readonly string[]).includes(event.status)) {
      throw new ForbiddenException('Only pending events can be reverted');
    }
    return this.prisma.event.update({
      where: { id: eventId },
      data: { status: EVENT_STATUS.REVERTED, revertNotes },
      include: {
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async approve(eventId: string, categoryAdminId: string, dto: ApproveEventDto = {}) {
    await this.ensureEventAccess(eventId, categoryAdminId);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !(EVENT_PENDING_APPROVAL_STATUSES as readonly string[]).includes(event.status)) {
      throw new ForbiddenException('Only pending events can be approved');
    }

    const newPublishAt = parsePublishAt(dto.publishAt);
    if (dto.publishAt && !newPublishAt) {
      throw new ForbiddenException('publishAt must be a valid ISO 8601 datetime.');
    }

    const wasScheduleMissed = event.status === EVENT_STATUS.SCHEDULE_MISSED;
    const resolved = resolveCategoryAdminApproveStatus(
      event.publishAt,
      {
        publishNow: dto.publishNow,
        newPublishAt,
        wasScheduleMissed,
      },
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const approved = await tx.event.update({
        where: { id: eventId },
        data: {
          status: resolved.status,
          publishAt: resolved.publishAt,
          publishedAt: resolved.publishedAt,
        },
        include: {
          school: { select: { name: true, image: true } },
          subCategory: { select: { id: true, name: true } },
          subCategoryAdmin: { select: { id: true, name: true, email: true } },
        },
      });

      if (event.resubmitFromEventId) {
        await tx.event.updateMany({
          where: {
            id: event.resubmitFromEventId,
            status: 'reverted',
          },
          data: {
            status: 'superseded',
            revertNotes: null,
          },
        });
      } else {
        // Legacy resubmits without a link: clear matching reverted correction rows.
        await tx.event.updateMany({
          where: {
            subCategoryAdminId: event.subCategoryAdminId,
            subCategoryId: event.subCategoryId,
            status: 'reverted',
            title: event.title,
          },
          data: {
            status: 'superseded',
            revertNotes: null,
          },
        });
      }

      return approved;
    });

    if (resolved.status === EVENT_STATUS.PUBLISHED) {
      void this.pushNotifications
        .notifyUsersForApprovedEvent({
          id: updated.id,
          schoolId: updated.schoolId,
          subCategoryId: updated.subCategoryId,
          title: updated.title,
          schoolName: updated.school?.name ?? undefined,
          schoolLogoUrl: updated.school?.image ?? null,
        })
        .catch((err) => {
          console.error('[CategoryAdminEvents] push notify failed', err);
        });
    }
    return updated;
  }
}
