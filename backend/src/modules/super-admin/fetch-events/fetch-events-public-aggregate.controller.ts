import { Controller, Get, Query } from '@nestjs/common';
import { FetchEventsService } from './fetch-events.service';

/** Cross-university public feed (all active sources). */
@Controller('public/university-events')
export class FetchEventsPublicAggregateController {
  constructor(private readonly service: FetchEventsService) {}

  @Get()
  async listAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('upcoming') upcoming?: string,
    @Query('latest') latest?: string,
    @Query('trending') trending?: string,
    @Query('dateUtc') dateUtc?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.listEvents({
      search,
      category,
      upcoming: upcoming === '1' || upcoming === 'true',
      latest: latest === '1' || latest === 'true',
      trending: trending === '1' || trending === 'true',
      onDateUtc: dateUtc?.trim() || undefined,
      sort: (sort as 'startDate' | 'firstSeenAt' | 'title') || undefined,
      order: (order as 'asc' | 'desc') || undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
