import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as multer from 'multer';
import * as path from 'path';
import { ExternalAdminGuard } from '../guards/external-admin.guard';
import { CreateExternalJobRequestDto } from './dto/create-job-request.dto';
import { CreateExternalOfferRequestDto } from './dto/create-offer-request.dto';
import { CreateExternalCampaignRequestDto } from './dto/create-campaign-request.dto';
import { CreateExternalPostRequestDto } from './dto/create-post-request.dto';
import { ExternalPostReplyDto } from './dto/post-reply.dto';
import { ExternalAdminPostRequestsService } from './post-requests.service';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const IMAGES_DIR = path.join(process.cwd(), 'uploads', 'external-admin-event-images');

@Controller('external-admin/post-requests')
@UseGuards(ExternalAdminGuard)
export class ExternalAdminPostRequestsController {
  constructor(private readonly service: ExternalAdminPostRequestsService) {}

  @Get('requests')
  list(@Request() req: { user: { sub: string } }) {
    return this.service.listMyRequests(req.user.sub);
  }

  @Get('requests/summary')
  summary(@Request() req: { user: { sub: string } }) {
    return this.service.summary(req.user.sub);
  }

  @Get('requests/:id')
  getOne(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.service.getRequest(req.user.sub, id);
  }

  @Post('requests/:id/reply')
  reply(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: ExternalPostReplyDto,
  ) {
    return this.service.reply(req.user.sub, id, dto);
  }

  @Get('approved-schools')
  approvedSchools(
    @Request() req: { user: { sub: string } },
    @Query('externalCategoryId') externalCategoryId: string,
  ) {
    return this.service.listApprovedSchools(req.user.sub, externalCategoryId);
  }

  @Post('requests')
  create(@Request() req: { user: { sub: string } }, @Body() dto: CreateExternalPostRequestDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Post('jobs')
  createJob(@Request() req: { user: { sub: string } }, @Body() dto: CreateExternalJobRequestDto) {
    return this.service.createJob(req.user.sub, dto);
  }

  @Post('offers')
  createOffer(@Request() req: { user: { sub: string } }, @Body() dto: CreateExternalOfferRequestDto) {
    return this.service.createOffer(req.user.sub, dto);
  }

  @Post('campaigns')
  createCampaign(@Request() req: { user: { sub: string } }, @Body() dto: CreateExternalCampaignRequestDto) {
    return this.service.createCampaign(req.user.sub, dto);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
          cb(null, IMAGES_DIR);
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
    return { url: `/uploads/external-admin-event-images/${file.filename}` };
  }
}
