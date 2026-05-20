import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateScrapedEventSourceDto } from '../dto/create-scraped-event-source.dto';
import { UpdateScrapedEventSourceDto } from '../dto/update-scraped-event-source.dto';

@Injectable()
export class ScrapedEventSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.scrapedEventSource.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { events: true } } },
    });
    return rows.map(({ _count, ...rest }) => ({
      ...rest,
      totalEvents: _count.events,
    }));
  }

  async findOne(id: string) {
    const row = await this.prisma.scrapedEventSource.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Source not found');
    return row;
  }

  async create(dto: CreateScrapedEventSourceDto) {
    return this.prisma.scrapedEventSource.create({
      data: {
        name: dto.name,
        websiteUrl: dto.websiteUrl,
        scraperType: dto.scraperType?.trim() || 'generic',
        selectorsJson:
          dto.selectorsJson === undefined
            ? Prisma.JsonNull
            : (dto.selectorsJson as Prisma.InputJsonValue),
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateScrapedEventSourceDto) {
    await this.findOne(id);
    const data: Prisma.ScrapedEventSourceUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.websiteUrl !== undefined) data.websiteUrl = dto.websiteUrl;
    if (dto.scraperType !== undefined) data.scraperType = dto.scraperType;
    if (dto.selectorsJson !== undefined) {
      data.selectorsJson =
        dto.selectorsJson === null
          ? Prisma.JsonNull
          : (dto.selectorsJson as Prisma.InputJsonValue);
    }
    if (dto.active !== undefined) data.active = dto.active;
    return this.prisma.scrapedEventSource.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.scrapedEventSource.delete({ where: { id } });
    return { ok: true };
  }
}
