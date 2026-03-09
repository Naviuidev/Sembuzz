import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { AdsAdminGuard } from '../guards/ads-admin.guard';
import { AdsAdminBannerAdsService } from './banner-ads.service';
import { CreateBannerAdDto } from './dto/create-banner-ad.dto';
import { UpdateBannerAdDto } from './dto/update-banner-ad.dto';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const BANNER_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'ads-admin-banner-ads');

@Controller('ads-admin/banner-ads')
@UseGuards(AdsAdminGuard)
export class AdsAdminBannerAdsController {
  constructor(private readonly bannerAdsService: AdsAdminBannerAdsService) {}

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        if (!fs.existsSync(BANNER_IMAGES_DIR)) {
          fs.mkdirSync(BANNER_IMAGES_DIR, { recursive: true });
        }
        cb(null, BANNER_IMAGES_DIR);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: MAX_SIZE },
    }),
  )
  async uploadBannerImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
    }
    // Return relative path so frontend can resolve against its current API base (works for both local and production)
    return {
      url: `/uploads/ads-admin-banner-ads/${file.filename}`,
    };
  }

  @Post()
  async create(@Request() req: { user: { sub: string } }, @Body() dto: CreateBannerAdDto) {
    return this.bannerAdsService.create(req.user.sub, dto);
  }

  @Get()
  async list(@Request() req: { user: { sub: string } }) {
    return this.bannerAdsService.listByAdsAdmin(req.user.sub);
  }

  @Get('analytics')
  async getAnalytics(
    @Request() req: { user: { sub: string } },
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('bannerAdId') bannerAdId?: string,
  ) {
    return this.bannerAdsService.getAnalytics(req.user.sub, dateFrom, dateTo, bannerAdId);
  }

  @Patch(':id')
  async update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateBannerAdDto,
  ) {
    return this.bannerAdsService.updateSchedule(req.user.sub, id, dto);
  }

  @Patch(':id/end-now')
  async endNow(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.bannerAdsService.endNow(req.user.sub, id);
  }

  @Delete(':id')
  async delete(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.bannerAdsService.remove(req.user.sub, id);
  }
}
