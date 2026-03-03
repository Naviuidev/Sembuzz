import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBannerAdDto } from './dto/create-banner-ad.dto';
import { UpdateBannerAdDto } from './dto/update-banner-ad.dto';

@Injectable()
export class AdsAdminBannerAdsService {
  constructor(private prisma: PrismaService) {}

  private async getSchoolId(adsAdminId: string): Promise<string | null> {
    const admin = await this.prisma.adsAdmin.findUnique({
      where: { id: adsAdminId },
      select: { schoolId: true },
    });
    return admin?.schoolId ?? null;
  }

  async create(adsAdminId: string, dto: CreateBannerAdDto) {
    const schoolId = await this.getSchoolId(adsAdminId);
    if (!schoolId) throw new ForbiddenException('Ads admin not found');

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) {
      throw new ForbiddenException('End date/time must be after start date/time');
    }

    return this.prisma.bannerAd.create({
      data: {
        adsAdminId,
        schoolId,
        categoryId: null,
        imageUrl: dto.imageUrl,
        externalLink: dto.externalLink?.trim() || null,
        startAt,
        endAt,
      },
    });
  }

  async listByAdsAdmin(adsAdminId: string) {
    return this.prisma.bannerAd.findMany({
      where: { adsAdminId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, imageUrl: true, externalLink: true, startAt: true, endAt: true, createdAt: true },
    });
  }

  async getAnalytics(adsAdminId: string, dateFrom?: string, dateTo?: string, bannerAdId?: string) {
    const whereAd: { adsAdminId: string; id?: string } = { adsAdminId };
    if (bannerAdId) whereAd.id = bannerAdId;
    const ads = await this.prisma.bannerAd.findMany({
      where: whereAd,
      select: { id: true, imageUrl: true, externalLink: true, startAt: true, endAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const adIds = ads.map((a) => a.id);
    if (adIds.length === 0) {
      return { ads: [], totals: { views: 0, clicks: 0 }, byDay: [] };
    }
    const eventWhere: { bannerAdId: { in: string[] }; createdAt?: { gte?: Date; lte?: Date } } = { bannerAdId: { in: adIds } };
    if (dateFrom && dateTo) {
      eventWhere.createdAt = {
        gte: new Date(dateFrom + 'T00:00:00.000Z'),
        lte: new Date(dateTo + 'T23:59:59.999Z'),
      };
    }
    const events = await this.prisma.bannerAdEvent.findMany({
      where: eventWhere,
      select: { bannerAdId: true, eventType: true, createdAt: true },
    });
    const viewsByAd: Record<string, number> = {};
    const clicksByAd: Record<string, number> = {};
    adIds.forEach((id) => ((viewsByAd[id] = 0), (clicksByAd[id] = 0)));
    const byDayMap: Record<string, { views: number; clicks: number }> = {};
    events.forEach((e) => {
      const day = e.createdAt.toISOString().slice(0, 10);
      if (!byDayMap[day]) byDayMap[day] = { views: 0, clicks: 0 };
      if (e.eventType === 'view') {
        viewsByAd[e.bannerAdId]++;
        byDayMap[day].views++;
      } else if (e.eventType === 'click') {
        clicksByAd[e.bannerAdId]++;
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

  async updateSchedule(adsAdminId: string, bannerAdId: string, dto: UpdateBannerAdDto) {
    const ad = await this.prisma.bannerAd.findFirst({
      where: { id: bannerAdId, adsAdminId },
    });
    if (!ad) throw new ForbiddenException('Banner ad not found');
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) {
      throw new ForbiddenException('End date/time must be after start date/time');
    }
    return this.prisma.bannerAd.update({
      where: { id: bannerAdId },
      data: {
        startAt,
        endAt,
        ...(dto.externalLink !== undefined ? { externalLink: dto.externalLink?.trim() || null } : {}),
      },
    });
  }

  async endNow(adsAdminId: string, bannerAdId: string) {
    const ad = await this.prisma.bannerAd.findFirst({
      where: { id: bannerAdId, adsAdminId },
    });
    if (!ad) throw new ForbiddenException('Banner ad not found');
    const now = new Date();
    return this.prisma.bannerAd.update({
      where: { id: bannerAdId },
      data: { endAt: now },
    });
  }

  async remove(adsAdminId: string, bannerAdId: string) {
    const ad = await this.prisma.bannerAd.findFirst({
      where: { id: bannerAdId, adsAdminId },
    });
    if (!ad) throw new ForbiddenException('Banner ad not found');
    const now = new Date();
    if (now >= ad.startAt && now <= ad.endAt) {
      throw new ForbiddenException('Cannot delete an active ad. Set the ad to inactive first, then you can delete it.');
    }
    await this.prisma.bannerAd.delete({ where: { id: bannerAdId } });
    return { deleted: true };
  }
}
