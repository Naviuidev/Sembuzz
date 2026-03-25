import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class UserNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInbox(userId: string) {
    try {
      const inbox = (this.prisma as PrismaService & { userNotificationInbox: any }).userNotificationInbox;
      if (!inbox) return [];
      const rows = await inbox.findMany({
        where: { userId },
        orderBy: { deliveredAt: 'desc' },
        take: 500,
      });
      return this.enrichInboxRowsWithSchoolLogos(rows);
    } catch {
      return [];
    }
  }

  private hasUsableLogo(url: string | null | undefined): boolean {
    const s = typeof url === 'string' ? url.trim() : '';
    if (!s || s === 'null' || s === 'undefined') return false;
    return true;
  }

  private firstEventImageUrl(imageUrlsJson: string | null | undefined): string | null {
    if (!imageUrlsJson?.trim()) return null;
    try {
      const arr = JSON.parse(imageUrlsJson) as unknown;
      if (!Array.isArray(arr)) return null;
      const first = arr.find((x) => typeof x === 'string' && x.trim());
      return first ? String(first).trim() : null;
    } catch {
      return null;
    }
  }

  /**
   * Prefer current `School.image` for every row with `schoolId`, then fall back to the related
   * `Event` (school image or first image in `imageUrls`) so the list always shows a real asset
   * when one exists in the DB — not only when push persisted `schoolLogoUrl`.
   */
  private async enrichInboxRowsWithSchoolLogos(
    rows: Array<{
      id: string;
      schoolId: string | null;
      eventId: string | null;
      schoolLogoUrl: string | null;
      [key: string]: unknown;
    }>,
  ) {
    if (rows.length === 0) return rows;

    let out = rows.map((r) => ({ ...r }));

    const allSchoolIds = [...new Set(out.map((r) => r.schoolId).filter(Boolean))] as string[];
    if (allSchoolIds.length > 0) {
      const schools = await this.prisma.school.findMany({
        where: { id: { in: allSchoolIds } },
        select: { id: true, image: true },
      });
      const schoolImageById = new Map(schools.map((s) => [s.id, s.image?.trim() || '']));
      out = out.map((r) => {
        const sid = r.schoolId as string | null | undefined;
        if (!sid) return r;
        const img = schoolImageById.get(sid);
        if (!this.hasUsableLogo(img)) return r;
        return { ...r, schoolLogoUrl: img as string };
      });
    }

    const eventIds = [
      ...new Set(
        out.filter((r) => !this.hasUsableLogo(r.schoolLogoUrl as string | null) && r.eventId).map((r) => r.eventId as string),
      ),
    ];
    if (eventIds.length > 0) {
      const events = await this.prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: {
          id: true,
          imageUrls: true,
          school: { select: { image: true } },
        },
      });
      const logoByEventId = new Map(
        events.map((e) => {
          const fromSchool = e.school?.image?.trim() || '';
          const fromPost = this.firstEventImageUrl(e.imageUrls);
          const logo = (this.hasUsableLogo(fromSchool) ? fromSchool : fromPost) || '';
          return [e.id, logo];
        }),
      );
      out = out.map((r) => {
        if (this.hasUsableLogo(r.schoolLogoUrl as string | null)) return r;
        const eid = r.eventId as string | null | undefined;
        if (!eid) return r;
        const logo = logoByEventId.get(eid);
        if (!this.hasUsableLogo(logo)) return r;
        return { ...r, schoolLogoUrl: logo as string };
      });
    }

    return out;
  }

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    try {
      const inbox = (this.prisma as PrismaService & { userNotificationInbox: any }).userNotificationInbox;
      if (!inbox) return { unreadCount: 0 };
      const unreadCount = await inbox.count({
        where: { userId, readAt: null },
      });
      return { unreadCount };
    } catch {
      return { unreadCount: 0 };
    }
  }

  async markAllRead(userId: string): Promise<{ ok: boolean }> {
    try {
      const inbox = (this.prisma as PrismaService & { userNotificationInbox: any }).userNotificationInbox;
      if (!inbox) return { ok: true };
      await inbox.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    } catch {
      return { ok: true };
    }
    return { ok: true };
  }

  async markRead(userId: string, id: string): Promise<{ ok: boolean }> {
    try {
      const inbox = (this.prisma as PrismaService & { userNotificationInbox: any }).userNotificationInbox;
      if (!inbox) return { ok: true };
      await inbox.updateMany({
        where: { id, userId, readAt: null },
        data: { readAt: new Date() },
      });
    } catch {
      return { ok: true };
    }
    return { ok: true };
  }

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
