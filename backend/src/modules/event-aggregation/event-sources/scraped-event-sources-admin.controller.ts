import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../super-admin/guards/super-admin.guard';
import { CreateScrapedEventSourceDto } from '../dto/create-scraped-event-source.dto';
import { UpdateScrapedEventSourceDto } from '../dto/update-scraped-event-source.dto';
import { ScrapedEventSourcesService } from './scraped-event-sources.service';
import { ScrapedSyncService } from '../sync/scraped-sync.service';

@Controller('super-admin/event-sync/sources')
@UseGuards(SuperAdminGuard)
export class ScrapedEventSourcesAdminController {
  constructor(
    private readonly sources: ScrapedEventSourcesService,
    private readonly sync: ScrapedSyncService,
  ) {}

  @Get()
  findAll() {
    return this.sources.findAll();
  }

  @Post()
  create(@Body() dto: CreateScrapedEventSourceDto) {
    return this.sources.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScrapedEventSourceDto) {
    return this.sources.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sources.remove(id);
  }

  @Post(':id/sync')
  triggerSync(@Param('id') id: string) {
    return this.sync.triggerSync(id);
  }
}
