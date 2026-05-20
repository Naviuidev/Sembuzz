import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../super-admin/guards/super-admin.guard';
import { ScrapedEventsService } from './scraped-events.service';

@Controller('super-admin/event-sync/events')
@UseGuards(SuperAdminGuard)
export class ScrapedEventsAdminController {
  constructor(private readonly events: ScrapedEventsService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
    @Query('sourceId') sourceId?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    const s = sort === 'title' || sort === 'createdAt' ? sort : 'startDate';
    const o = order === 'desc' ? 'desc' : 'asc';
    return this.events.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      category,
      sourceId,
      sort: s as 'startDate' | 'title' | 'createdAt',
      order: o as 'asc' | 'desc',
    });
  }

  @Get('upcoming')
  async upcoming(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.events.upcoming({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('month')
  async month(
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const year = yearStr ? Number(yearStr) : NaN;
    const month = monthStr ? Number(monthStr) : NaN;
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      throw new BadRequestException('Query params year and month are required');
    }
    return this.events.byMonth(year, month, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    return this.events.getById(id);
  }
}
