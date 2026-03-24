import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class UserNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerPushToken(
    userId: string,
    token: string,
    platform: string,
  ): Promise<{ ok: boolean }> {
    const p = platform === 'ios' || platform === 'android' || platform === 'web' ? platform : 'android';
    await this.prisma.userPushDevice.upsert({
      where: {
        userId_token: { userId, token },
      },
      create: {
        id: randomUUID(),
        userId,
        token,
        platform: p,
      },
      update: {
        platform: p,
      },
    });
    return { ok: true };
  }

  async removePushToken(userId: string, token: string): Promise<{ ok: boolean }> {
    await this.prisma.userPushDevice.deleteMany({
      where: { userId, token },
    });
    return { ok: true };
  }

  async getNotificationSubcategories(userId: string): Promise<{ subCategoryIds: string[] }> {
    const rows = await this.prisma.userNotificationSubCategory.findMany({
      where: { userId },
      select: { subCategoryId: true },
    });
    return { subCategoryIds: rows.map((r) => r.subCategoryId) };
  }

  /**
   * Replaces prefs. Only subcategories whose parent category belongs to the user's school are kept.
   */
  async setNotificationSubcategories(
    userId: string,
    subCategoryIds: string[],
  ): Promise<{ subCategoryIds: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (subCategoryIds.length === 0) {
      await this.prisma.userNotificationSubCategory.deleteMany({ where: { userId } });
      return { subCategoryIds: [] };
    }

    const subs = await this.prisma.subCategory.findMany({
      where: {
        id: { in: subCategoryIds },
        category: { schoolId: user.schoolId },
      },
      select: { id: true },
    });
    const allowed = new Set(subs.map((s) => s.id));
    const valid = subCategoryIds.filter((id) => allowed.has(id));

    await this.prisma.userNotificationSubCategory.deleteMany({ where: { userId } });
    if (valid.length > 0) {
      await this.prisma.userNotificationSubCategory.createMany({
        data: valid.map((subCategoryId) => ({ userId, subCategoryId })),
      });
    }

    return { subCategoryIds: valid };
  }
}
