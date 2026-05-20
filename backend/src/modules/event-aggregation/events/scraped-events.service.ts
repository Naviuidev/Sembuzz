import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ScrapedEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private tz(): string {
    return (
      this.config.get<string>('EVENT_SYNC_TIMEZONE')?.trim() ||
      this.config.get<string>('UNIVERSITY_EVENTS_TIMEZONE')?.trim() ||
      'America/New_York'
    );
  }

  async list(params: {
    page?: number;
    pageSize?: number;
    category?: string;
    sourceId?: string;
    sort?: 'startDate' | 'title' | 'createdAt';
    order?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
    const where: Prisma.ScrapedEventRecordWhereInput = {};
    if (params.category?.trim()) where.category = params.category.trim();
    if (params.sourceId?.trim()) where.sourceId = params.sourceId.trim();

    const sortField =
      params.sort === 'title' ? 'title' : params.sort === 'createdAt' ? 'createdAt' : 'startDate';
    const order: Prisma.SortOrder = params.order === 'desc' ? 'desc' : 'asc';

    const [total, items] = await Promise.all([
      this.prisma.scrapedEventRecord.count({ where }),
      this.prisma.scrapedEventRecord.findMany({
        where,
        orderBy: { [sortField]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { source: { select: { id: true, name: true, websiteUrl: true } } },
      }),
    ]);
    return { total, page, pageSize, items };
  }

  async upcoming(params: { page?: number; pageSize?: number }) {
    const now = new Date();
    const startOfToday = DateTime.fromJSDate(now, { zone: 'utc' })
      .setZone(this.tz())
      .startOf('day')
      .toUTC()
      .toJSDate();
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
    const where: Prisma.ScrapedEventRecordWhereInput = {
      startDate: { gte: startOfToday },
    };
    const [total, items] = await Promise.all([
      this.prisma.scrapedEventRecord.count({ where }),
      this.prisma.scrapedEventRecord.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { source: { select: { id: true, name: true, websiteUrl: true } } },
      }),
    ]);
    return { total, page, pageSize, items };
  }

  async byMonth(year: number, month: number, params: { page?: number; pageSize?: number }) {
    if (month < 1 || month > 12) throw new BadRequestException('month must be 1–12');
    const z = this.tz();
    const start = DateTime.fromObject({ year, month, day: 1 }, { zone: z }).startOf('month');
    if (!start.isValid) throw new BadRequestException('invalid year/month');
    const endEx = start.plus({ months: 1 });
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
    const where: Prisma.ScrapedEventRecordWhereInput = {
      AND: [
        { startDate: { gte: start.toUTC().toJSDate() } },
        { startDate: { lt: endEx.toUTC().toJSDate() } },
      ],
    };
    const [total, items] = await Promise.all([
      this.prisma.scrapedEventRecord.count({ where }),
      this.prisma.scrapedEventRecord.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { source: { select: { id: true, name: true, websiteUrl: true } } },
      }),
    ]);
    return { total, page, pageSize, year, month, items };
  }

  async getById(id: string) {
    const row = await this.prisma.scrapedEventRecord.findUnique({
      where: { id },
      include: { source: { select: { id: true, name: true, websiteUrl: true } } },
    });
    if (!row) throw new NotFoundException('Event not found');
    return row;
  }
}
