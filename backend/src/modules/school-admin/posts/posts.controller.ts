import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
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
import { SchoolAdminPostsService } from './posts.service';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { UpdatePostDto } from './dto/update-post.dto';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const POST_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'school-admin-post-images');

@Controller('school-admin/posts')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminPostsController {
  constructor(private readonly postsService: SchoolAdminPostsService) {}

  @Get()
  async list(@Request() req: { user: { schoolId: string } }) {
    return this.postsService.findAllForSchool(req.user.schoolId);
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string } },
  ) {
    return this.postsService.findOne(id, req.user.schoolId);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(POST_IMAGES_DIR)) {
            fs.mkdirSync(POST_IMAGES_DIR, { recursive: true });
          }
          cb(null, POST_IMAGES_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
    }
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return {
      url: `${baseUrl}/uploads/school-admin-post-images/${file.filename}`,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePostDto,
    @Request() req: { user: { schoolId: string } },
  ) {
    return this.postsService.update(id, req.user.schoolId, {
      title: body.title,
      description: body.description,
      externalLink: body.externalLink,
      commentsEnabled: body.commentsEnabled,
      imageUrls: body.imageUrls,
    });
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string } },
  ) {
    return this.postsService.delete(id, req.user.schoolId);
  }
}
