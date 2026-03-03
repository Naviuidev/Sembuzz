import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('events')
export class EventsPublicController {
  constructor(private prisma: PrismaService) {}

  @Get('categories')
  async getCategoriesBySchool(@Query('schoolId') schoolId: string) {
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    if (!sid) return [];
    return this.prisma.category.findMany({
      where: { schoolId: sid },
      include: {
        subcategories: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Same Event table as category-admin/events/approved; returns all approved events (all schools) when no schoolId. Used by public /events page (guest + logged-in). */
  @Get('approved')
  async findApproved(
    @Query('schoolId') schoolId?: string,
    @Query('subCategoryIds') subCategoryIdsStr?: string,
  ) {
    const subCategoryIds =
      subCategoryIdsStr && subCategoryIdsStr.trim()
        ? subCategoryIdsStr.split(',').map((id) => id.trim()).filter(Boolean)
        : undefined;
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    const where = {
      status: 'approved' as const,
      ...(sid ? { schoolId: sid } : {}),
      ...(subCategoryIds?.length
        ? { subCategoryId: { in: subCategoryIds } }
        : {}),
    };

    // Debug: log counts so we can see if approved events exist in DB
    const [totalEvents, approvedCount, list] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.count({ where: { status: 'approved' } }),
      this.prisma.event.findMany({
        where,
        include: {
          school: { select: { name: true, image: true } },
          subCategory: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 500,
      }),
    ]);
    console.log(
      `[Events] GET /events/approved${sid ? ` schoolId=${sid}` : ' (all schools)'}: ` +
        `returning ${list.length}, DB has ${approvedCount} approved / ${totalEvents} total events`,
    );

    return list;
  }

  /** Upcoming/scheduled posts by date (school admin created). Public, no auth. date=YYYY-MM-DD. Visible when date equals scheduledTo. */
  @Get('upcoming')
  async getUpcomingByDate(@Query('date') dateStr?: string) {
    if (!dateStr || typeof dateStr !== 'string') return [];
    const dayStart = new Date(dateStr.trim() + 'T00:00:00.000Z');
    const dayEnd = new Date(dateStr.trim() + 'T23:59:59.999Z');
    if (Number.isNaN(dayStart.getTime())) return [];
    return this.prisma.upcomingPost.findMany({
      where: { scheduledTo: { gte: dayStart, lte: dayEnd } },
      include: {
        school: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Public like, comment, and saved counts for event IDs (no auth). Optional dateFrom/dateTo (YYYY-MM-DD) filter engagement by when the action happened. */
  @Get('engagement-counts')
  async getEngagementCounts(
    @Query('eventIds') eventIdsStr?: string,
    @Query('dateFrom') dateFromStr?: string,
    @Query('dateTo') dateToStr?: string,
  ) {
    const eventIds =
      eventIdsStr && eventIdsStr.trim()
        ? eventIdsStr.split(',').map((id) => id.trim()).filter(Boolean)
        : [];
    if (eventIds.length === 0) {
      return {
        likes: {} as Record<string, number>,
        commentCounts: {} as Record<string, number>,
        savedCounts: {} as Record<string, number>,
      };
    }

    const eventFilter = { eventId: { in: eventIds } };
    let dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (dateFromStr && typeof dateFromStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateFromStr.trim())) {
      dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(dateFromStr.trim() + 'T00:00:00.000Z') };
    }
    if (dateToStr && typeof dateToStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateToStr.trim())) {
      dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(dateToStr.trim() + 'T23:59:59.999Z') };
    }
    const whereLike = { ...eventFilter, ...(Object.keys(dateFilter).length ? dateFilter : {}) };
    const whereComment = { ...eventFilter, ...(Object.keys(dateFilter).length ? dateFilter : {}) };
    const whereSaved = { ...eventFilter, ...(Object.keys(dateFilter).length ? dateFilter : {}) };

    const [likeCounts, commentCounts, savedCounts] = await Promise.all([
      this.prisma.eventLike.groupBy({
        by: ['eventId'],
        where: whereLike,
        _count: { eventId: true },
      }),
      this.prisma.eventComment.groupBy({
        by: ['eventId'],
        where: whereComment,
        _count: { eventId: true },
      }),
      this.prisma.userSavedEvent.groupBy({
        by: ['eventId'],
        where: whereSaved,
        _count: { eventId: true },
      }),
    ]);

    const likes: Record<string, number> = {};
    eventIds.forEach((id) => (likes[id] = 0));
    likeCounts.forEach((g) => (likes[g.eventId] = g._count.eventId));
    const commentCountsMap: Record<string, number> = {};
    eventIds.forEach((id) => (commentCountsMap[id] = 0));
    commentCounts.forEach((g) => (commentCountsMap[g.eventId] = g._count.eventId));
    const savedCountsMap: Record<string, number> = {};
    eventIds.forEach((id) => (savedCountsMap[id] = 0));
    savedCounts.forEach((g) => (savedCountsMap[g.eventId] = g._count.eventId));
    return { likes, commentCounts: commentCountsMap, savedCounts: savedCountsMap };
  }

  /** Active banner ads: startAt <= now <= endAt. Optional schoolId to filter by school. For guests and logged-in users. */
  @Get('banner-ads')
  async getActiveBannerAds(@Query('schoolId') schoolId?: string) {
    const now = new Date();
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    const list = await this.prisma.bannerAd.findMany({
      where: {
        startAt: { lte: now },
        endAt: { gte: now },
        ...(sid ? { schoolId: sid } : {}),
      },
      select: { id: true, imageUrl: true, externalLink: true, startAt: true, endAt: true, schoolId: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return list;
  }

  /** Record a view for a banner ad (public, no auth). Ad must be active. */
  @Post('banner-ads/:id/view')
  async recordBannerAdView(@Param('id') id: string) {
    const now = new Date();
    const ad = await this.prisma.bannerAd.findFirst({
      where: { id, startAt: { lte: now }, endAt: { gte: now } },
    });
    if (!ad) return { ok: false };
    await this.prisma.bannerAdEvent.create({ data: { bannerAdId: id, eventType: 'view' } });
    return { ok: true };
  }

  /** Record a click for a banner ad and return redirect URL (public, no auth). Ad must be active. */
  @Post('banner-ads/:id/click')
  async recordBannerAdClick(@Param('id') id: string): Promise<{ ok: boolean; redirectUrl?: string | null }> {
    const now = new Date();
    const ad = await this.prisma.bannerAd.findFirst({
      where: { id, startAt: { lte: now }, endAt: { gte: now } },
      select: { externalLink: true },
    });
    if (!ad) return { ok: false };
    await this.prisma.bannerAdEvent.create({ data: { bannerAdId: id, eventType: 'click' } });
    return { ok: true, redirectUrl: ad.externalLink ?? null };
  }

  /** Active sponsored ads: startAt <= now <= endAt. Optional schoolId. Same UI as news, light blue bg, "Ad" badge. */
  @Get('sponsored-ads')
  async getActiveSponsoredAds(@Query('schoolId') schoolId?: string) {
    const now = new Date();
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    const list = await this.prisma.sponsoredAd.findMany({
      where: {
        startAt: { lte: now },
        endAt: { gte: now },
        ...(sid ? { schoolId: sid } : {}),
      },
      include: { school: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return list;
  }

  @Post('sponsored-ads/:id/view')
  async recordSponsoredAdView(@Param('id') id: string) {
    const now = new Date();
    const ad = await this.prisma.sponsoredAd.findFirst({
      where: { id, startAt: { lte: now }, endAt: { gte: now } },
    });
    if (!ad) return { ok: false };
    await this.prisma.sponsoredAdEvent.create({ data: { sponsoredAdId: id, eventType: 'view' } });
    return { ok: true };
  }

  @Post('sponsored-ads/:id/click')
  async recordSponsoredAdClick(@Param('id') id: string): Promise<{ ok: boolean; redirectUrl?: string | null }> {
    const now = new Date();
    const ad = await this.prisma.sponsoredAd.findFirst({
      where: { id, startAt: { lte: now }, endAt: { gte: now } },
      select: { externalLink: true },
    });
    if (!ad) return { ok: false };
    await this.prisma.sponsoredAdEvent.create({ data: { sponsoredAdId: id, eventType: 'click' } });
    return { ok: true, redirectUrl: ad.externalLink ?? null };
  }
}
