import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSponsoredAdDto } from './dto/create-sponsored-ad.dto';
import { UpdateSponsoredAdDto } from './dto/update-sponsored-ad.dto';

@Injectable()
export class CategoryAdminSponsoredAdsService {
  constructor(private prisma: PrismaService) {}

  private async getScope(categoryAdminId: string): Promise<{ schoolId: string; categoryId: string } | null> {
    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { id: categoryAdminId },
      select: { schoolId: true, categoryId: true },
    });
    return admin ? { schoolId: admin.schoolId, categoryId: admin.categoryId } : null;
  }

  async create(categoryAdminId: string, dto: CreateSponsoredAdDto) {
    const scope = await this.getScope(categoryAdminId);
    if (!scope) throw new ForbiddenException('Category admin not found');
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) throw new ForbiddenException('End date/time must be after start date/time');
    const imageUrls = dto.imageUrls?.trim() || null;
    return this.prisma.sponsoredAd.create({
      data: {
        categoryAdminId,
        categoryId: scope.categoryId,
        schoolId: scope.schoolId,
        title: dto.title?.trim() || null,
        description: dto.description?.trim() || null,
        imageUrls,
        externalLink: dto.externalLink?.trim() || null,
        startAt,
        endAt,
      },
    });
  }

  async listByCategoryAdmin(categoryAdminId: string) {
    return this.prisma.sponsoredAd.findMany({
      where: { categoryAdminId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true, imageUrls: true, externalLink: true, startAt: true, endAt: true, createdAt: true },
    });
  }

  async getAnalytics(categoryAdminId: string, dateFrom?: string, dateTo?: string, sponsoredAdId?: string) {
    const whereAd: { categoryAdminId: string; id?: string } = { categoryAdminId };
    if (sponsoredAdId) whereAd.id = sponsoredAdId;
    const ads = await this.prisma.sponsoredAd.findMany({
      where: whereAd,
      select: { id: true, title: true, imageUrls: true, externalLink: true, startAt: true, endAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const adIds = ads.map((a) => a.id);
    if (adIds.length === 0) return { ads: [], totals: { views: 0, clicks: 0 }, byDay: [] };
    const eventWhere: { sponsoredAdId: { in: string[] }; createdAt?: { gte?: Date; lte?: Date } } = { sponsoredAdId: { in: adIds } };
    if (dateFrom && dateTo) {
      eventWhere.createdAt = {
        gte: new Date(dateFrom + 'T00:00:00.000Z'),
        lte: new Date(dateTo + 'T23:59:59.999Z'),
      };
    }
    const events = await this.prisma.sponsoredAdEvent.findMany({
      where: eventWhere,
      select: { sponsoredAdId: true, eventType: true, createdAt: true },
    });
    const viewsByAd: Record<string, number> = {};
    const clicksByAd: Record<string, number> = {};
    adIds.forEach((id) => ((viewsByAd[id] = 0), (clicksByAd[id] = 0)));
    const byDayMap: Record<string, { views: number; clicks: number }> = {};
    events.forEach((e) => {
      const day = e.createdAt.toISOString().slice(0, 10);
      if (!byDayMap[day]) byDayMap[day] = { views: 0, clicks: 0 };
      if (e.eventType === 'view') {
        viewsByAd[e.sponsoredAdId]++;
        byDayMap[day].views++;
      } else if (e.eventType === 'click') {
        clicksByAd[e.sponsoredAdId]++;
        byDayMap[day].clicks++;
      }
    });
    const byDay = Object.entries(byDayMap)
      .map(([date, v]) => ({ date, views: v.views, clicks: v.clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const totals = { views: Object.values(viewsByAd).reduce((a, b) => a + b, 0), clicks: Object.values(clicksByAd).reduce((a, b) => a + b, 0) };
    return {
      ads: ads.map((a) => ({ ...a, views: viewsByAd[a.id], clicks: clicksByAd[a.id] })),
      totals,
      byDay,
    };
  }

  async updateSchedule(categoryAdminId: string, id: string, dto: UpdateSponsoredAdDto) {
    const ad = await this.prisma.sponsoredAd.findFirst({ where: { id, categoryAdminId } });
    if (!ad) throw new ForbiddenException('Sponsored ad not found');
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) throw new ForbiddenException('End date/time must be after start date/time');
    return this.prisma.sponsoredAd.update({
      where: { id },
      data: {
        startAt,
        endAt,
        ...(dto.externalLink !== undefined ? { externalLink: dto.externalLink?.trim() || null } : {}),
        ...(dto.title !== undefined ? { title: dto.title?.trim() || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.imageUrls !== undefined ? { imageUrls: dto.imageUrls?.trim() || null } : {}),
      },
    });
  }

  async endNow(categoryAdminId: string, id: string) {
    const ad = await this.prisma.sponsoredAd.findFirst({ where: { id, categoryAdminId } });
    if (!ad) throw new ForbiddenException('Sponsored ad not found');
    return this.prisma.sponsoredAd.update({ where: { id }, data: { endAt: new Date() } });
  }

  async remove(categoryAdminId: string, id: string) {
    const ad = await this.prisma.sponsoredAd.findFirst({ where: { id, categoryAdminId } });
    if (!ad) throw new ForbiddenException('Sponsored ad not found');
    const now = new Date();
    if (now >= ad.startAt && now <= ad.endAt) {
      throw new ForbiddenException('Cannot delete an active ad. Set the ad to inactive first, then you can delete it.');
    }
    await this.prisma.sponsoredAd.delete({ where: { id } });
    return { deleted: true };
  }
}
