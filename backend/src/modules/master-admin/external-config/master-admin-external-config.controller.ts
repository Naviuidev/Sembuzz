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
import { MasterAdminGuard } from '../guards/master-admin.guard';
import { PipelineActionMessageDto } from '../../school-admin/external-pipeline/dto/pipeline-action.dto';
import { PipelineReplyDto } from '../../school-admin/external-pipeline/dto/pipeline-reply.dto';
import { ExternalPostActionDto } from '../../school-admin/external-post-requests/dto/post-action.dto';
import { ExternalPostReplyDto } from '../../school-admin/external-post-requests/dto/post-reply.dto';
import { CreateExternalJobRequestDto } from '../../external-admin/post-requests/dto/create-job-request.dto';
import { CreateExternalOfferRequestDto } from '../../external-admin/post-requests/dto/create-offer-request.dto';
import { CreateExternalCampaignRequestDto } from '../../external-admin/post-requests/dto/create-campaign-request.dto';
import { PublishMasterAdminExternalPostDto } from './dto/publish-external-post.dto';
import { MasterAdminExternalConfigService, type ExternalContentKind } from './master-admin-external-config.service';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const IMAGES_DIR = path.join(process.cwd(), 'uploads', 'external-admin-event-images');

type MasterReq = { user: { sub: string } };

@Controller('master-admin/external-config')
@UseGuards(MasterAdminGuard)
export class MasterAdminExternalConfigController {
  constructor(private readonly service: MasterAdminExternalConfigService) {}

  @Get('schools')
  listSchoolsWithExternalActivity() {
    return this.service.listSchoolsWithExternalActivity();
  }

  @Get('content-context')
  contentContext(@Query('schoolId') schoolId: string, @Query('kind') kind: ExternalContentKind) {
    return this.service.getContentContext(schoolId, kind);
  }

  @Post('jobs')
  createJob(@Query('schoolId') schoolId: string, @Body() dto: CreateExternalJobRequestDto) {
    const { schoolId: _s, externalCategoryId: _c, ...rest } = dto;
    return this.service.createJob(schoolId, rest);
  }

  @Post('offers')
  createOffer(@Query('schoolId') schoolId: string, @Body() dto: CreateExternalOfferRequestDto) {
    const { schoolId: _s, externalCategoryId: _c, ...rest } = dto;
    return this.service.createOffer(schoolId, rest);
  }

  @Post('campaigns')
  createCampaign(@Query('schoolId') schoolId: string, @Body() dto: CreateExternalCampaignRequestDto) {
    const { schoolId: _s, externalCategoryId: _c, ...rest } = dto;
    return this.service.createCampaign(schoolId, rest);
  }

  @Post('post-requests/requests/:id/publish')
  publishPost(@Param('id') id: string, @Body() dto: PublishMasterAdminExternalPostDto) {
    return this.service.publishExternalPost(id, dto);
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

  @Get('pipeline/requests/pending-count')
  pipelinePendingCount(@Query('schoolId') schoolId: string) {
    return this.service.pipelinePendingCount(schoolId);
  }

  @Get('pipeline/requests')
  listPipeline(@Query('schoolId') schoolId: string) {
    return this.service.listPipelineRequests(schoolId);
  }

  @Get('pipeline/requests/:id')
  getPipeline(@Param('id') id: string, @Query('schoolId') schoolId: string) {
    return this.service.getPipelineRequest(schoolId, id);
  }

  @Post('pipeline/requests/:id/reply')
  pipelineReply(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: PipelineReplyDto,
  ) {
    return this.service.pipelineReply(req.user.sub, schoolId, id, dto);
  }

  @Post('pipeline/requests/:id/send-query')
  pipelineSendQuery(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: PipelineActionMessageDto,
  ) {
    return this.service.pipelineSendQuery(req.user.sub, schoolId, id, dto);
  }

  @Post('pipeline/requests/:id/approve')
  pipelineApprove(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: PipelineActionMessageDto,
  ) {
    return this.service.pipelineApprove(req.user.sub, schoolId, id, dto);
  }

  @Post('pipeline/requests/:id/reject')
  pipelineReject(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: PipelineActionMessageDto,
  ) {
    return this.service.pipelineReject(req.user.sub, schoolId, id, dto);
  }

  @Post('pipeline/requests/:id/ban')
  pipelineBan(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: PipelineActionMessageDto,
  ) {
    return this.service.pipelineBan(req.user.sub, schoolId, id, dto);
  }

  @Get('post-requests/pending-count')
  postPendingCount(@Query('schoolId') schoolId: string) {
    return this.service.postPendingCount(schoolId);
  }

  @Get('post-requests/requests')
  listPosts(@Query('schoolId') schoolId: string) {
    return this.service.listPostRequests(schoolId);
  }

  @Get('post-requests/requests/:id')
  getPost(@Param('id') id: string, @Query('schoolId') schoolId: string) {
    return this.service.getPostRequest(schoolId, id);
  }

  @Post('post-requests/requests/:id/reply')
  postReply(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: ExternalPostReplyDto,
  ) {
    return this.service.postReply(req.user.sub, schoolId, id, dto);
  }

  @Post('post-requests/requests/:id/send-query')
  postSendQuery(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: ExternalPostActionDto,
  ) {
    return this.service.postSendQuery(req.user.sub, schoolId, id, dto);
  }

  @Post('post-requests/requests/:id/approve')
  postApprove(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: ExternalPostActionDto,
  ) {
    return this.service.postApprove(req.user.sub, schoolId, id, dto);
  }

  @Post('post-requests/requests/:id/reject')
  postReject(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: ExternalPostActionDto,
  ) {
    return this.service.postReject(req.user.sub, schoolId, id, dto);
  }

  @Post('post-requests/requests/:id/ban')
  postBan(
    @Request() req: MasterReq,
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: ExternalPostActionDto,
  ) {
    return this.service.postBan(req.user.sub, schoolId, id, dto);
  }
}
