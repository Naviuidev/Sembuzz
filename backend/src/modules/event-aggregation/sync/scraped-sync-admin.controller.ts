import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../../super-admin/guards/super-admin.guard';
import { ScrapedSyncService } from './scraped-sync.service';

@Controller('super-admin/event-sync/sync')
@UseGuards(SuperAdminGuard)
export class ScrapedSyncAdminController {
  constructor(private readonly sync: ScrapedSyncService) {}

  @Get('logs')
  logs(@Query('sourceId') sourceId?: string, @Query('limit') limit?: string) {
    return this.sync.listLogs(sourceId, limit ? Number(limit) : 50);
  }

  @Get('status')
  status() {
    return this.sync.status();
  }
}
