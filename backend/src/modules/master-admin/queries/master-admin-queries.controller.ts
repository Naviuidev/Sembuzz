import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { MasterAdminGuard } from '../guards/master-admin.guard';
import { MasterAdminQueriesService } from './master-admin-queries.service';
import { MasterAdminRaiseQueryDto } from './dto/master-admin-raise-query.dto';
import { MasterAdminDeveloperRequestDto } from './dto/master-admin-developer-request.dto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'query-attachments');
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Controller('master-admin/queries')
@UseGuards(MasterAdminGuard)
export class MasterAdminQueriesController {
  constructor(private readonly queriesService: MasterAdminQueriesService) {}

  @Get()
  listInbox(@Query('schoolId') schoolId?: string) {
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    if (!sid) throw new BadRequestException('schoolId is required');
    return this.queriesService.listInbox(sid);
  }

  @Post('raise')
  raise(@Body() dto: MasterAdminRaiseQueryDto) {
    return this.queriesService.raise(dto);
  }

  @Post('developer-request')
  developerRequest(@Body() dto: MasterAdminDeveloperRequestDto) {
    return this.queriesService.sendDeveloperRequest(dto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File): { url: string } {
    if (!file) throw new BadRequestException('File is required');
    return { url: `/uploads/query-attachments/${file.filename}` };
  }

  @Post(':schoolId/from-category-admins/:id/reply')
  replyCategory(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    return this.queriesService.replyToCategoryAdmin(schoolId, id, body.message);
  }

  @Post(':schoolId/from-subcategory-admins/:id/reply')
  replySubcategory(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    return this.queriesService.replyToSubcategoryAdmin(schoolId, id, body.message);
  }
}
