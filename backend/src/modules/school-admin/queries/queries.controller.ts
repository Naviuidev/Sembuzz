import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { QueriesService } from './queries.service';
import { CreateQueryDto } from '../dto/create-query.dto';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { SuperAdminGuard } from '../../super-admin/guards/super-admin.guard';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'query-attachments');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('school-admin/queries')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  @Post()
  @UseGuards(SchoolAdminGuard)
  async create(@Request() req, @Body() createQueryDto: CreateQueryDto) {
    return this.queriesService.create(req.user.sub, createQueryDto);
  }

  @Post('upload')
  @UseGuards(SchoolAdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '';
          const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const url = `/uploads/query-attachments/${file.filename}`;
    return { url };
  }

  @Get()
  @UseGuards(SchoolAdminGuard)
  async findAllForAdmin(@Request() req) {
    return this.queriesService.findAll(req.user.sub);
  }

  @Get('from-category-admins')
  @UseGuards(SchoolAdminGuard)
  async listFromCategoryAdmins(@Request() req) {
    return this.queriesService.listFromCategoryAdmins(req.user.sub);
  }

  @Get('from-subcategory-admins')
  @UseGuards(SchoolAdminGuard)
  async listFromSubCategoryAdmins(@Request() req) {
    return this.queriesService.listFromSubCategoryAdmins(req.user.sub);
  }

  @Post('to-category-admin')
  @UseGuards(SchoolAdminGuard)
  async createToCategoryAdmin(@Request() req, @Body() dto: CreateQueryDto) {
    return this.queriesService.createToCategoryAdmin(req.user.sub, dto);
  }

  @Post('to-subcategory-admin')
  @UseGuards(SchoolAdminGuard)
  async createToSubCategoryAdmin(@Request() req, @Body() dto: CreateQueryDto) {
    return this.queriesService.createToSubCategoryAdmin(req.user.sub, dto);
  }

  @Post('from-category-admins/:id/reply')
  @UseGuards(SchoolAdminGuard)
  async replyToCategoryAdmin(@Param('id') id: string, @Body() body: { message: string }) {
    return this.queriesService.replyToCategoryAdmin(id, body.message);
  }

  @Post('from-subcategory-admins/:id/reply')
  @UseGuards(SchoolAdminGuard)
  async replyToSubcategoryAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }, @Body() body: { message: string }) {
    return this.queriesService.replyToSubcategoryAdmin(req.user.sub, id, body.message);
  }

  @Get('all')
  @UseGuards(SuperAdminGuard)
  async findAllForSuperAdmin() {
    return this.queriesService.findAll();
  }

  @Get(':id')
  @UseGuards(SchoolAdminGuard)
  async findOne(@Param('id') id: string) {
    return this.queriesService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(SuperAdminGuard)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.queriesService.updateStatus(id, body.status);
  }

  @Post(':id/reply')
  @UseGuards(SuperAdminGuard)
  async sendReply(@Param('id') id: string, @Body() body: { message: string }) {
    return this.queriesService.sendReply(id, body.message);
  }

  @Delete('raised/:id')
  @UseGuards(SchoolAdminGuard)
  async deleteRaised(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.queriesService.deleteRaisedToSuperAdmin(id, req.user.sub);
  }

  @Delete('from-category-admins/:id')
  @UseGuards(SchoolAdminGuard)
  async deleteFromCategoryAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.queriesService.deleteFromCategoryAdmin(id, req.user.sub);
  }

  @Delete('from-subcategory-admins/:id')
  @UseGuards(SchoolAdminGuard)
  async deleteFromSubcategoryAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.queriesService.deleteFromSubcategoryAdmin(id, req.user.sub);
  }
}
