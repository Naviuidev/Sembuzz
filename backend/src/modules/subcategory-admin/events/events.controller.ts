import type { Request as ExpressRequest } from 'express';
import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { EventsService, AnalyzeBannerResult } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { SubCategoryAdminBlogsService } from '../blogs/blogs.service';
import { parseCreateBlogBody } from '../blogs/dto/parse-create-blog-body';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const EVENT_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-event-images');
const BLOG_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-blog-images');

@Controller('subcategory-admin/events')
@UseGuards(SubCategoryAdminGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly blogsService: SubCategoryAdminBlogsService,
  ) {}

  @Post('analyze-banner')
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: multer.memoryStorage(),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async analyzeBanner(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<AnalyzeBannerResult> {
    if (!file) {
      throw new BadRequestException('Banner image is required');
    }
    const buffer = (file as Express.Multer.File & { buffer?: Buffer }).buffer ?? file.buffer;
    if (!buffer) {
      throw new BadRequestException('Could not read file. Try a smaller image.');
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, PNG, GIF, WebP',
      );
    }
    return this.eventsService.analyzeBannerImage(buffer, file.mimetype);
  }

  /** Event images, or blog images when query ?for=blog (same URL so one proxy / one route always works) */
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (req: ExpressRequest, _file, cb) => {
          const forBlog =
            String(req.query?.for || '') === 'blog' ||
            String(req.query?.dest || '') === 'blog';
          const dir = forBlog ? BLOG_IMAGES_DIR : EVENT_IMAGES_DIR;
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async uploadEventImage(
    @Request() req: ExpressRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
    }
    const forBlog =
      String(req.query?.for || '') === 'blog' ||
      String(req.query?.dest || '') === 'blog';
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const sub = forBlog ? 'subcategory-admin-blog-images' : 'subcategory-admin-event-images';
    return {
      url: `${baseUrl}/uploads/${sub}/${file.filename}`,
    };
  }

  /** Create blog (raw body — avoids ValidationPipe rejecting hero/contentBlocks). */
  @Post('blog')
  async createBlog(
    @Request() req: ExpressRequest & { user: { sub: string } },
  ) {
    const dto = parseCreateBlogBody(req.body);
    if (!dto.subCategoryId?.trim() || !dto.title?.trim()) {
      throw new BadRequestException('subCategoryId and title are required');
    }
    return this.blogsService.create(req.user.sub, dto);
  }

  @Post()
  async create(@Request() req: { user: { sub: string } }, @Body() dto: CreateEventDto) {
    return this.eventsService.create(req.user.sub, dto);
  }

  @Get('pending')
  async findPending(@Request() req: { user: { sub: string } }) {
    return this.eventsService.findPendingBySubCategoryAdmin(req.user.sub);
  }

  @Get('reverted')
  async findReverted(@Request() req: { user: { sub: string } }) {
    return this.eventsService.findRevertedBySubCategoryAdmin(req.user.sub);
  }

  @Get('approved')
  async findApproved(@Request() req: { user: { sub: string } }) {
    return this.eventsService.findApprovedBySubCategoryAdmin(req.user.sub);
  }
}
