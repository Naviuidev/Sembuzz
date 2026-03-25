import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateEventDto } from './dto/update-event.dto';
import { PushNotificationService } from '../../push/push-notification.service';

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
        status: 'pending',
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
        status: 'approved',
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
    if (!event || event.status !== 'approved') {
      throw new ForbiddenException('Only approved events can be deleted');
    }
    await this.prisma.event.delete({ where: { id: eventId } });
    return { deleted: true };
  }

  async update(eventId: string, categoryAdminId: string, dto: UpdateEventDto) {
    await this.ensureEventAccess(eventId, categoryAdminId);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.status !== 'pending') {
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
    if (!event || event.status !== 'pending') {
      throw new ForbiddenException('Only pending events can be reverted');
    }
    return this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'reverted', revertNotes },
      include: {
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async approve(eventId: string, categoryAdminId: string) {
    await this.ensureEventAccess(eventId, categoryAdminId);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.status !== 'pending') {
      throw new ForbiddenException('Only pending events can be approved');
    }
    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'approved' },
      include: {
        school: { select: { name: true, image: true } },
        subCategory: { select: { id: true, name: true } },
        subCategoryAdmin: { select: { id: true, name: true, email: true } },
      },
    });
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
    return updated;
  }
}
