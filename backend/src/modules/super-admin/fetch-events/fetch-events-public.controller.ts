import { Controller, Get, Param, Query } from '@nestjs/common';
import { FetchEventsService } from './fetch-events.service';

/**
 * Public endpoints for the University Event Aggregator.
 * No authentication: these power the /universities tab on the public events page.
 */
@Controller('public/universities')
export class FetchEventsPublicController {
  constructor(private readonly service: FetchEventsService) {}

  @Get()
  async listUniversities() {
    return this.service.listPublicUniversities();
  }

  @Get(':id')
  async getUniversity(@Param('id') id: string) {
    return this.service.getPublicUniversity(id);
  }

  @Get(':id/events')
  async listEvents(
    @Param('id') id: string,
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
      sourceId: id,
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
