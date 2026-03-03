import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { SubCategoryAdminQueriesService } from './queries.service';
import { CreateSubCategoryAdminQueryDto } from './dto/create-query.dto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-query-attachments');
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Controller('subcategory-admin/queries')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminQueriesController {
  constructor(private readonly queriesService: SubCategoryAdminQueriesService) {}

  @Post()
  async create(@Request() req: { user: { sub: string } }, @Body() dto: CreateSubCategoryAdminQueryDto) {
    return this.queriesService.create(req.user.sub, dto);
  }

  @Get('from-school-admins')
  async listFromSchoolAdmins(@Request() req: { user: { sub: string } }) {
    return this.queriesService.listFromSchoolAdmins(req.user.sub);
  }

  @Get('from-category-admins')
  async listFromCategoryAdmins(@Request() req: { user: { sub: string } }) {
    return this.queriesService.listFromCategoryAdmins(req.user.sub);
  }

  @Post('to-school-admin')
  async createToSchoolAdmin(@Request() req: { user: { sub: string } }, @Body() dto: CreateSubCategoryAdminQueryDto) {
    return this.queriesService.createToSchoolAdmin(req.user.sub, dto);
  }

  @Post('to-super-admin')
  async createToSuperAdmin(@Request() req: { user: { sub: string } }, @Body() dto: CreateSubCategoryAdminQueryDto) {
    return this.queriesService.createToSuperAdmin(req.user.sub, dto);
  }

  @Post('from-school-admins/:id/reply')
  async replyToSchoolAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }, @Body() body: { message: string }) {
    return this.queriesService.replyToSchoolAdmin(req.user.sub, id, body.message);
  }

  @Post('from-category-admins/:id/reply')
  async replyToCategoryAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }, @Body() body: { message: string }) {
    return this.queriesService.replyToCategoryAdmin(req.user.sub, id, body.message);
  }

  @Delete('from-school-admins/:id')
  async deleteFromSchoolAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.queriesService.deleteFromSchoolAdmin(id, req.user.sub);
  }

  @Delete('from-category-admins/:id')
  async deleteFromCategoryAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.queriesService.deleteFromCategoryAdmin(id, req.user.sub);
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
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException(
        'No file was uploaded. Attachment is optional — you can send your request without an attachment.',
      );
    }
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return { url: `${baseUrl}/uploads/subcategory-admin-query-attachments/${file.filename}` };
  }
}
