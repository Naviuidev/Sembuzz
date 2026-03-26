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
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import { CategoryAdminQueriesService } from './queries.service';
import { CreateCategoryAdminQueryDto } from './dto/create-query.dto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'category-admin-query-attachments');
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Controller('category-admin/queries')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminQueriesController {
  constructor(private readonly queriesService: CategoryAdminQueriesService) {}

  @Post()
  async create(@Request() req: { user: { sub: string } }, @Body() dto: CreateCategoryAdminQueryDto) {
    return this.queriesService.create(req.user.sub, dto);
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
    if (!file) throw new BadRequestException('File is required');
    return { url: `/uploads/category-admin-query-attachments/${file.filename}` };
  }

  @Get()
  async list(@Request() req: { user: { sub: string } }) {
    return this.queriesService.listFromSubcategoryAdmins(req.user.sub);
  }

  @Get('from-school-admins')
  async listFromSchoolAdmins(@Request() req: { user: { sub: string } }) {
    return this.queriesService.listFromSchoolAdmins(req.user.sub);
  }

  @Post('to-subcategory-admin')
  async createToSubCategoryAdmin(@Request() req: { user: { sub: string } }, @Body() dto: CreateCategoryAdminQueryDto) {
    return this.queriesService.createToSubCategoryAdmin(req.user.sub, dto);
  }

  @Post('to-super-admin')
  async createToSuperAdmin(@Request() req: { user: { sub: string } }, @Body() dto: CreateCategoryAdminQueryDto) {
    return this.queriesService.createToSuperAdmin(req.user.sub, dto);
  }

  @Get('from-subcategory-admins')
  async listFromSubcategoryAdmins(@Request() req: { user: { sub: string } }) {
    return this.queriesService.listFromSubcategoryAdmins(req.user.sub);
  }

  @Get('raised-to-super-admin')
  async listRaisedToSuperAdmin(@Request() req: { user: { sub: string } }) {
    return this.queriesService.listRaisedToSuperAdmin(req.user.sub);
  }

  @Post('raised-to-super-admin/:id/reply')
  async sendFollowUpToSuperAdmin(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() body: { message: string },
  ) {
    return this.queriesService.sendFollowUpToSuperAdmin(req.user.sub, id, body.message);
  }

  @Post('from-subcategory-admins/:id/reply')
  async replyToSubcategoryAdmin(
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    return this.queriesService.replyToSubcategoryAdmin(id, body.message);
  }

  @Post('from-school-admins/:id/reply')
  async replyToSchoolAdmin(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body() body: { message: string },
  ) {
    return this.queriesService.replyToSchoolAdmin(req.user.sub, id, body.message);
  }

  @Delete('from-school-admins/:id')
  async deleteFromSchoolAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.queriesService.deleteFromSchoolAdmin(id, req.user.sub);
  }

  @Delete('from-subcategory-admins/:id')
  async deleteFromSubcategoryAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.queriesService.deleteFromSubcategoryAdmin(id, req.user.sub);
  }

  @Delete('raised-to-super-admin/:id')
  async deleteRaisedToSuperAdmin(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.queriesService.deleteRaisedToSuperAdmin(id, req.user.sub);
  }
}
