import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { MasterAdminBlogsService } from './master-admin-blogs.service';
import { CreateMasterAdminBlogDto, UpdateMasterAdminBlogDto } from './dto/create-master-admin-blog.dto';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const BLOG_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-blog-images');

@Controller('master-admin/blogs')
@UseGuards(MasterAdminGuard)
export class MasterAdminBlogsController {
  constructor(private readonly blogsService: MasterAdminBlogsService) {}

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(BLOG_IMAGES_DIR)) {
            fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });
          }
          cb(null, BLOG_IMAGES_DIR);
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
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
    }
    return { url: `/uploads/subcategory-admin-blog-images/${file.filename}` };
  }

  @Post()
  create(@Body() body: CreateMasterAdminBlogDto) {
    return this.blogsService.create(body);
  }

  @Get(':blogId')
  getOne(@Param('blogId') blogId: string, @Query('schoolId') schoolId?: string) {
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    if (!sid) throw new BadRequestException('schoolId is required');
    return this.blogsService.getOne(blogId, sid);
  }

  @Patch(':blogId')
  update(
    @Param('blogId') blogId: string,
    @Query('schoolId') schoolId: string,
    @Body() body: UpdateMasterAdminBlogDto,
  ) {
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    if (!sid) throw new BadRequestException('schoolId is required');
    return this.blogsService.update(blogId, sid, body);
  }

  @Post(':blogId/publish')
  publish(@Param('blogId') blogId: string, @Query('schoolId') schoolId: string) {
    const sid = typeof schoolId === 'string' ? schoolId.trim() : '';
    if (!sid) throw new BadRequestException('schoolId is required');
    return this.blogsService.publish(blogId, sid);
  }
}
