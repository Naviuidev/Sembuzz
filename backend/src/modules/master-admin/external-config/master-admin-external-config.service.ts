import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SchoolAdminExternalPipelineService } from '../../school-admin/external-pipeline/external-pipeline.service';
import { SchoolAdminExternalPostRequestsService } from '../../school-admin/external-post-requests/external-post-requests.service';
import { ExternalAdminPostRequestsService } from '../../external-admin/post-requests/post-requests.service';
import { PipelineActionMessageDto } from '../../school-admin/external-pipeline/dto/pipeline-action.dto';
import { PipelineReplyDto } from '../../school-admin/external-pipeline/dto/pipeline-reply.dto';
import { ExternalPostActionDto } from '../../school-admin/external-post-requests/dto/post-action.dto';
import { ExternalPostReplyDto } from '../../school-admin/external-post-requests/dto/post-reply.dto';
import { CreateExternalJobRequestDto } from '../../external-admin/post-requests/dto/create-job-request.dto';
import { CreateExternalOfferRequestDto } from '../../external-admin/post-requests/dto/create-offer-request.dto';
import { CreateExternalCampaignRequestDto } from '../../external-admin/post-requests/dto/create-campaign-request.dto';
import { PublishMasterAdminExternalPostDto } from './dto/publish-external-post.dto';
import { postInclude } from '../../external-school-post-messages/post-request-messages.service';

export type ExternalContentKind = 'job' | 'offer' | 'campaign';

@Injectable()
export class MasterAdminExternalConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: SchoolAdminExternalPipelineService,
    private readonly postRequests: SchoolAdminExternalPostRequestsService,
    private readonly externalPosts: ExternalAdminPostRequestsService,
  ) {}

  private normalizeCategoryName(name: string) {
    return name.trim().toLowerCase().replace(/[\s_-]+/g, '');
  }

  private categoryMatchesKind(kind: ExternalContentKind, categoryName: string) {
    const n = this.normalizeCategoryName(categoryName);
    if (kind === 'job') return n === 'jobshare';
    if (kind === 'offer') return n === 'offers';
    return n === 'campaign' || n === 'campaigns';
  }

  private async resolveApprovedPipeline(schoolId: string, kind: ExternalContentKind) {
    const pipelines = await this.prisma.externalCategorySchoolPipelineRequest.findMany({
      where: { schoolId, status: 'approved' },
      include: {
        externalCategory: { select: { id: true, name: true, isActive: true } },
        externalAdmin: { select: { id: true, name: true, isActive: true } },
      },
    });
    const row = pipelines.find(
      (p) => p.externalCategory.isActive && p.externalAdmin.isActive && this.categoryMatchesKind(kind, p.externalCategory.name),
    );
    if (!row) {
      throw new BadRequestException(
        'No approved external admin pipeline for this school and content type. Approve pipeline access first.',
      );
    }
    return {
      externalAdminId: row.externalAdminId,
      externalCategoryId: row.externalCategoryId,
      categoryName: row.externalCategory.name,
    };
  }

  async getContentContext(schoolId: string, kind: ExternalContentKind) {
    await this.ensureSchool(schoolId);
    try {
      const ctx = await this.resolveApprovedPipeline(schoolId, kind);
      return { ...ctx, canPost: true };
    } catch {
      return { canPost: false, externalCategoryId: null, categoryName: null, externalAdminId: null };
    }
  }

  createJob(schoolId: string, dto: Omit<CreateExternalJobRequestDto, 'schoolId' | 'externalCategoryId'>) {
    return this.ensureSchool(schoolId).then(async () => {
      const ctx = await this.resolveApprovedPipeline(schoolId, 'job');
      return this.externalPosts.createJob(ctx.externalAdminId, {
        ...dto,
        schoolId,
        externalCategoryId: ctx.externalCategoryId,
      });
    });
  }

  createOffer(schoolId: string, dto: Omit<CreateExternalOfferRequestDto, 'schoolId' | 'externalCategoryId'>) {
    return this.ensureSchool(schoolId).then(async () => {
      const ctx = await this.resolveApprovedPipeline(schoolId, 'offer');
      return this.externalPosts.createOffer(ctx.externalAdminId, {
        ...dto,
        schoolId,
        externalCategoryId: ctx.externalCategoryId,
      });
    });
  }

  createCampaign(
    schoolId: string,
    dto: Omit<CreateExternalCampaignRequestDto, 'schoolId' | 'externalCategoryId'>,
  ) {
    return this.ensureSchool(schoolId).then(async () => {
      const ctx = await this.resolveApprovedPipeline(schoolId, 'campaign');
      return this.externalPosts.createCampaign(ctx.externalAdminId, {
        ...dto,
        schoolId,
        externalCategoryId: ctx.externalCategoryId,
      });
    });
  }

  async publishExternalPost(postId: string, dto: PublishMasterAdminExternalPostDto) {
    await this.ensureSchool(dto.schoolId);
    const post = await this.prisma.externalSchoolPostRequest.findFirst({
      where: { id: postId, schoolId: dto.schoolId },
    });
    if (!post) throw new NotFoundException('External post not found.');
    if (post.status === 'approved') {
      throw new BadRequestException('This post is already approved.');
    }
    if (!['pending', 'query', 'rejected'].includes(post.status)) {
      throw new BadRequestException('This post cannot be published.');
    }
    if (post.contentType !== dto.contentKind) {
      throw new BadRequestException('Content type does not match this post.');
    }

    const publishPatch: Record<string, unknown> = {
      status: 'approved',
      reviewedAt: new Date(),
      subcategoryStatus: null,
    };

    const isJobOfferCampaign = post.contentType === 'job' || post.contentType === 'offer' || post.contentType === 'campaign';

    if (isJobOfferCampaign) {
      if (post.contentType === 'job') publishPatch.jobPublishStatus = 'published';
      if (post.contentType === 'offer') publishPatch.offerPublishStatus = 'published';
      if (post.contentType === 'campaign') publishPatch.offerPublishStatus = 'published';
    } else {
      if (!dto.categoryId?.trim() || !dto.subCategoryId?.trim()) {
        throw new BadRequestException('Category and subcategory are required for this post type.');
      }
      const sub = await this.prisma.subCategory.findFirst({
        where: {
          id: dto.subCategoryId,
          categoryId: dto.categoryId,
          category: { schoolId: dto.schoolId },
        },
      });
      if (!sub) throw new BadRequestException('Subcategory does not belong to the selected school category.');
      publishPatch.subCategoryId = dto.subCategoryId;
      publishPatch.subcategoryStatus = 'approved';
    }

    return this.prisma.externalSchoolPostRequest.update({
      where: { id: postId },
      data: publishPatch,
      include: postInclude,
    });
  }

  private async ensureSchool(schoolId: string): Promise<void> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
  }

  /** Schools that have at least one external admin pipeline request or post submission. */
  async listSchoolsWithExternalActivity() {
    const [pipelineRows, postRows] = await Promise.all([
      this.prisma.externalCategorySchoolPipelineRequest.findMany({
        distinct: ['schoolId'],
        select: { schoolId: true },
      }),
      this.prisma.externalSchoolPostRequest.findMany({
        distinct: ['schoolId'],
        select: { schoolId: true },
      }),
    ]);
    const schoolIds = [
      ...new Set([
        ...pipelineRows.map((r) => r.schoolId),
        ...postRows.map((r) => r.schoolId),
      ]),
    ];
    if (schoolIds.length === 0) return [];
    return this.prisma.school.findMany({
      where: { id: { in: schoolIds }, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  listPipelineRequests(schoolId: string) {
    return this.ensureSchool(schoolId).then(() => this.pipeline.listForSchool(schoolId));
  }

  getPipelineRequest(schoolId: string, id: string) {
    return this.ensureSchool(schoolId).then(() => this.pipeline.getForSchool(id, schoolId));
  }

  pipelinePendingCount(schoolId: string) {
    return this.ensureSchool(schoolId).then(() => this.pipeline.pendingCount(schoolId));
  }

  pipelineSendQuery(actorId: string, schoolId: string, id: string, dto: PipelineActionMessageDto) {
    return this.ensureSchool(schoolId).then(() => this.pipeline.sendQuery(actorId, schoolId, id, dto));
  }

  pipelineReply(actorId: string, schoolId: string, id: string, dto: PipelineReplyDto) {
    return this.ensureSchool(schoolId).then(() => this.pipeline.reply(actorId, schoolId, id, dto));
  }

  pipelineApprove(actorId: string, schoolId: string, id: string, dto: PipelineActionMessageDto) {
    return this.ensureSchool(schoolId).then(() => this.pipeline.approve(actorId, schoolId, id, dto));
  }

  pipelineReject(actorId: string, schoolId: string, id: string, dto: PipelineActionMessageDto) {
    return this.ensureSchool(schoolId).then(() => this.pipeline.reject(actorId, schoolId, id, dto));
  }

  pipelineBan(actorId: string, schoolId: string, id: string, dto: PipelineActionMessageDto) {
    return this.ensureSchool(schoolId).then(() => this.pipeline.ban(actorId, schoolId, id, dto));
  }

  listPostRequests(schoolId: string) {
    return this.ensureSchool(schoolId).then(() => this.postRequests.listForSchool(schoolId));
  }

  getPostRequest(schoolId: string, id: string) {
    return this.ensureSchool(schoolId).then(() => this.postRequests.getForSchool(id, schoolId));
  }

  postPendingCount(schoolId: string) {
    return this.ensureSchool(schoolId).then(() => this.postRequests.pendingCount(schoolId));
  }

  postSendQuery(actorId: string, schoolId: string, id: string, dto: ExternalPostActionDto) {
    return this.ensureSchool(schoolId).then(() => this.postRequests.sendQuery(actorId, schoolId, id, dto));
  }

  postReply(actorId: string, schoolId: string, id: string, dto: ExternalPostReplyDto) {
    return this.ensureSchool(schoolId).then(() => this.postRequests.reply(actorId, schoolId, id, dto));
  }

  postApprove(actorId: string, schoolId: string, id: string, dto: ExternalPostActionDto) {
    return this.ensureSchool(schoolId).then(() => this.postRequests.approve(actorId, schoolId, id, dto));
  }

  postReject(actorId: string, schoolId: string, id: string, dto: ExternalPostActionDto) {
    return this.ensureSchool(schoolId).then(() => this.postRequests.reject(actorId, schoolId, id, dto));
  }

  postBan(actorId: string, schoolId: string, id: string, dto: ExternalPostActionDto) {
    return this.ensureSchool(schoolId).then(() => this.postRequests.ban(actorId, schoolId, id, dto));
  }
}
