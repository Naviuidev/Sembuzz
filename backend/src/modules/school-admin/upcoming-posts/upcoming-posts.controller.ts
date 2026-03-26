import {
  Controller,
  Get,
  Post,
  Patch,
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
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { UpcomingPostsService } from './upcoming-posts.service';
import { CreateUpcomingPostDto } from './dto/create-upcoming-post.dto';
import { UpdateUpcomingPostDto } from './dto/update-upcoming-post.dto';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'school-admin-upcoming-images');

@Controller('school-admin/upcoming-posts')
@UseGuards(SchoolAdminGuard)
export class UpcomingPostsController {
  constructor(private readonly service: UpcomingPostsService) {}

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File): { url: string } {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIMES.includes(file.mimetype)) throw new BadRequestException('Allowed: JPEG, PNG, GIF, WebP');
    return { url: `/uploads/school-admin-upcoming-images/${file.filename}` };
  }

  @Post()
  create(@Request() req: { user: { schoolId: string } }, @Body() dto: CreateUpcomingPostDto) {
    return this.service.create(req.user.schoolId, dto);
  }

  @Get()
  list(@Request() req: { user: { schoolId: string } }) {
    return this.service.findAllForSchool(req.user.schoolId);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req: { user: { schoolId: string } }) {
    return this.service.findOne(id, req.user.schoolId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string } },
    @Body() dto: UpdateUpcomingPostDto,
  ) {
    return this.service.update(id, req.user.schoolId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: { schoolId: string } }) {
    return this.service.remove(id, req.user.schoolId);
  }
}
