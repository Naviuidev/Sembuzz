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

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const EVENT_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-event-images');

@Controller('subcategory-admin/events')
@UseGuards(SubCategoryAdminGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(EVENT_IMAGES_DIR)) {
            fs.mkdirSync(EVENT_IMAGES_DIR, { recursive: true });
          }
          cb(null, EVENT_IMAGES_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async uploadEventImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
    }
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    return {
      url: `${baseUrl}/uploads/subcategory-admin-event-images/${file.filename}`,
    };
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
