import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { FetchEventsService } from './fetch-events.service';

/** Rosters may be .xlsx (larger than CSV); keep a modest cap. */
const CSV_MAX_SIZE = 12 * 1024 * 1024; // 12MB

@Controller('super-admin/fetch-events')
@UseGuards(SuperAdminGuard)
export class FetchEventsController {
  constructor(private readonly service: FetchEventsService) {}

  // -------- CSV / URL ingest --------

  @Post('upload-csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: CSV_MAX_SIZE },
    }),
  )
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Spreadsheet file is required');
    const buffer = (file as Express.Multer.File & { buffer?: Buffer }).buffer ?? file.buffer;
    if (!buffer) throw new BadRequestException('Could not read CSV');
    return this.service.ingestCsv(buffer, file.originalname);
  }

  @Post('upload-url')
  async uploadUrl(@Body() body: { url?: string; universityName?: string }) {
    return this.service.addUrlSource(body.universityName || '', body.url || '');
  }

  // -------- Sync --------

  @Post('sync')
  async syncAll() {
    return this.service.syncAll();
  }

  @Post('sources/:id/sync')
  async syncOne(@Param('id') id: string) {
    return this.service.syncOne(id);
  }

  // -------- Sources --------

  @Get('sources')
  async listSources() {
    return this.service.listSources();
  }

  // -------- CSV batches --------

  @Get('batches')
  async listBatches() {
    return this.service.listBatches();
  }

  @Post('batches/:batchId/sync')
  async syncBatch(@Param('batchId') batchId: string) {
    return this.service.syncBatch(batchId);
  }

  @Delete('batches/:batchId')
  async deleteBatch(@Param('batchId') batchId: string) {
    return this.service.deleteBatch(batchId);
  }

  @Get('sync-jobs')
  async listSyncJobs(@Query('limit') limit?: string) {
    return this.service.listSyncJobs(limit ? Number(limit) : undefined);
  }

  @Get('sync-jobs/:id')
  async getSyncJob(@Param('id') id: string) {
    return this.service.getSyncJob(id);
  }

  // -------- Sync runs (Phenom-style history) --------

  @Get('runs')
  async listRuns(@Query('limit') limit?: string) {
    return this.service.listRecentRuns(limit ? Number(limit) : undefined);
  }

  @Patch('sources/:id')
  async toggleSource(@Param('id') id: string, @Body() body: { isActive?: boolean }) {
    return this.service.toggleSourceActive(id, body.isActive !== false);
  }

  @Delete('sources/:id')
  async deleteSource(@Param('id') id: string) {
    return this.service.deleteSource(id);
  }

  // -------- Events --------

  @Get('events')
  async listEvents(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('sourceId') sourceId?: string,
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
      sourceId,
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

  @Delete('events/:id')
  async deleteEvent(@Param('id') id: string) {
    return this.service.deleteEvent(id);
  }
}
