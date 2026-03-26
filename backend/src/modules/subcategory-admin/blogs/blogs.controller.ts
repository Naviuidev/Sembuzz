import {
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { SubCategoryAdminBlogsService } from './blogs.service';
import { parseCreateBlogBody } from './dto/parse-create-blog-body';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const BLOG_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-blog-images');

@Controller('subcategory-admin/blogs')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminBlogsController {
  constructor(private readonly blogsService: SubCategoryAdminBlogsService) {}

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
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
    }
    return {
      url: `/uploads/subcategory-admin-blog-images/${file.filename}`,
    };
  }

  @Post()
  async create(@Request() req: ExpressRequest & { user: { sub: string } }) {
    const dto = parseCreateBlogBody(req.body);
    if (!dto.subCategoryId?.trim() || !dto.title?.trim()) {
      throw new BadRequestException('subCategoryId and title are required');
    }
    return this.blogsService.create(req.user.sub, dto);
  }

  @Get('pending')
  async pending(@Request() req: { user: { sub: string } }) {
    return this.blogsService.findPending(req.user.sub);
  }

  @Get('reverted')
  async reverted(@Request() req: { user: { sub: string } }) {
    return this.blogsService.findReverted(req.user.sub);
  }

  @Get('rejected')
  async rejected(@Request() req: { user: { sub: string } }) {
    return this.blogsService.findRejected(req.user.sub);
  }

  @Get('approved')
  async approved(@Request() req: { user: { sub: string } }) {
    return this.blogsService.findApproved(req.user.sub);
  }
}
