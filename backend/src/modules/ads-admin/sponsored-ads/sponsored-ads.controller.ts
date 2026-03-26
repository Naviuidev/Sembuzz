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
import { AdsAdminSponsoredAdsService } from './sponsored-ads.service';
import { CreateSponsoredAdDto } from './dto/create-sponsored-ad.dto';
import { UpdateSponsoredAdDto } from './dto/update-sponsored-ad.dto';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SPONSORED_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'ads-admin-sponsored-ads');

@Controller('ads-admin/sponsored-ads')
@UseGuards(AdsAdminGuard)
export class AdsAdminSponsoredAdsController {
  constructor(private readonly sponsoredAdsService: AdsAdminSponsoredAdsService) {}

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(SPONSORED_IMAGES_DIR)) {
            fs.mkdirSync(SPONSORED_IMAGES_DIR, { recursive: true });
          }
          cb(null, SPONSORED_IMAGES_DIR);
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
    return { url: `/uploads/ads-admin-sponsored-ads/${file.filename}` };
  }

  @Post()
  async create(@Request() req: { user: { sub: string } }, @Body() dto: CreateSponsoredAdDto) {
    return this.sponsoredAdsService.create(req.user.sub, dto);
  }

  @Get()
  async list(@Request() req: { user: { sub: string } }) {
    return this.sponsoredAdsService.listByAdsAdmin(req.user.sub);
  }

  @Get('analytics')
  async getAnalytics(
    @Request() req: { user: { sub: string } },
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sponsoredAdId') sponsoredAdId?: string,
  ) {
    return this.sponsoredAdsService.getAnalytics(req.user.sub, dateFrom, dateTo, sponsoredAdId);
  }

  @Patch(':id')
  async update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateSponsoredAdDto,
  ) {
    return this.sponsoredAdsService.updateSchedule(req.user.sub, id, dto);
  }

  @Patch(':id/end-now')
  async endNow(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.sponsoredAdsService.endNow(req.user.sub, id);
  }

  @Delete(':id')
  async delete(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.sponsoredAdsService.remove(req.user.sub, id);
  }
}
