import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ExternalSchoolPostMessagesService,
  postInclude,
} from '../../external-school-post-messages/post-request-messages.service';
import { CreateExternalJobRequestDto } from './dto/create-job-request.dto';
import { CreateExternalOfferRequestDto } from './dto/create-offer-request.dto';
import { CreateExternalCampaignRequestDto } from './dto/create-campaign-request.dto';
import { CreateExternalPostRequestDto } from './dto/create-post-request.dto';
import { ExternalPostReplyDto } from './dto/post-reply.dto';

@Injectable()
export class ExternalAdminPostRequestsService {
  constructor(
    private prisma: PrismaService,
    private threadService: ExternalSchoolPostMessagesService,
  ) {}

  async listMyRequests(externalAdminId: string) {
    return this.prisma.externalSchoolPostRequest.findMany({
      where: { externalAdminId },
      include: postInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async summary(externalAdminId: string) {
    const rows = await this.prisma.externalSchoolPostRequest.findMany({
      where: { externalAdminId, status: { in: ['pending', 'query'] } },
      include: { threadMessages: { orderBy: { createdAt: 'asc' } } },
    });
    const schoolQueries = rows.filter(
      (r) => this.threadService.lastMessageSenderRole(r.threadMessages) === 'school_admin',
    ).length;
    return { schoolQueries };
  }

  async getRequest(externalAdminId: string, id: string) {
    const row = await this.threadService.getForExternalAdmin(id, externalAdminId);
    if (!row) throw new NotFoundException('Post request not found.');
    return row;
  }

  async reply(externalAdminId: string, id: string, dto: ExternalPostReplyDto) {
    const row = await this.threadService.getForExternalAdmin(id, externalAdminId);
    if (!row) throw new NotFoundException('Post request not found.');
    if (['banned', 'approved', 'rejected'].includes(row.status)) {
      throw new BadRequestException('This conversation is closed.');
    }
    const message = dto.message.trim();
    await this.threadService.appendMessage(id, 'external_admin', message);
    return this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: { updatedAt: new Date() },
      include: postInclude,
    });
  }

  async listApprovedSchools(externalAdminId: string, externalCategoryId: string) {
    const link = await this.prisma.externalAdminCategory.findFirst({
      where: { externalAdminId, externalCategoryId },
      include: { externalCategory: true },
    });
    if (!link?.externalCategory.isActive) {
      throw new ForbiddenException('You do not have access to this external category.');
    }
    const rows = await this.prisma.externalCategorySchoolPipelineRequest.findMany({
      where: { externalAdminId, externalCategoryId, status: 'approved' },
      include: { school: { select: { id: true, name: true, city: true, refNum: true } } },
      orderBy: { school: { name: 'asc' } },
    });
    return rows.map((r) => r.school);
  }

  async create(externalAdminId: string, dto: CreateExternalPostRequestDto) {
    const link = await this.prisma.externalAdminCategory.findFirst({
      where: { externalAdminId, externalCategoryId: dto.externalCategoryId },
      include: { externalCategory: true },
    });
    if (!link?.externalCategory.isActive) {
      throw new ForbiddenException('You do not have access to this external category.');
    }
    const pipeline = await this.prisma.externalCategorySchoolPipelineRequest.findUnique({
      where: {
        externalAdminId_externalCategoryId_schoolId: {
          externalAdminId,
          externalCategoryId: dto.externalCategoryId,
          schoolId: dto.schoolId,
        },
      },
    });
    if (!pipeline || pipeline.status !== 'approved') {
      throw new ForbiddenException('Pipeline access must be approved for this school before posting.');
    }

    let eventDate: Date | null = null;
    if (dto.eventDate?.trim()) {
      const parsed = new Date(dto.eventDate.trim());
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid event date.');
      }
      eventDate = parsed;
    }

    if (dto.subCategoryId) {
      const sub = await this.prisma.subCategory.findFirst({
        where: { id: dto.subCategoryId, category: { schoolId: dto.schoolId } },
      });
      if (!sub) throw new BadRequestException('Subcategory does not belong to this school.');
      const catLink = await this.prisma.externalCategorySubcategoryLinkRequest.findFirst({
        where: {
          externalAdminId,
          externalCategoryId: dto.externalCategoryId,
          subCategoryId: dto.subCategoryId,
          status: 'approved',
        },
      });
      if (!catLink) {
        throw new ForbiddenException('Category name must be approved for this subcategory before posting.');
      }
    }

    const row = await this.prisma.externalSchoolPostRequest.create({
      data: {
        externalAdminId,
        externalCategoryId: dto.externalCategoryId,
        schoolId: dto.schoolId,
        subCategoryId: dto.subCategoryId?.trim() || null,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        externalLink: dto.externalLink?.trim() || null,
        imageUrls: dto.imageUrls?.trim() || null,
        eventDate,
        eventStartTime: dto.eventStartTime?.trim() || null,
        eventEndTime: dto.eventEndTime?.trim() || null,
        eventLocation: dto.eventLocation?.trim() || null,
        actionButtons: dto.actionButtons?.trim() || null,
        commentsEnabled: dto.commentsEnabled ?? false,
        status: 'pending',
      },
      include: postInclude,
    });

    return row;
  }

  async createJob(externalAdminId: string, dto: CreateExternalJobRequestDto) {
    const link = await this.prisma.externalAdminCategory.findFirst({
      where: { externalAdminId, externalCategoryId: dto.externalCategoryId },
      include: { externalCategory: true },
    });
    if (!link?.externalCategory.isActive) {
      throw new ForbiddenException('You do not have access to this external category.');
    }
    const pipeline = await this.prisma.externalCategorySchoolPipelineRequest.findUnique({
      where: {
        externalAdminId_externalCategoryId_schoolId: {
          externalAdminId,
          externalCategoryId: dto.externalCategoryId,
          schoolId: dto.schoolId,
        },
      },
    });
    if (!pipeline || pipeline.status !== 'approved') {
      throw new ForbiddenException('Pipeline access must be approved for this school before posting.');
    }

    const subCategoryId = dto.subCategoryId?.trim() || null;
    if (subCategoryId) {
      const sub = await this.prisma.subCategory.findFirst({
        where: { id: subCategoryId, category: { schoolId: dto.schoolId } },
      });
      if (!sub) throw new BadRequestException('Subcategory does not belong to this school.');
    }

    const deadline = new Date(dto.applicationDeadline.trim());
    if (Number.isNaN(deadline.getTime())) {
      throw new BadRequestException('Invalid application deadline.');
    }

    if (dto.applyButtonEnabled) {
      const url = dto.applyButtonUrl?.trim();
      if (!url) throw new BadRequestException('Apply button URL is required when Apply is enabled.');
    }

    if (dto.applicationMethod === 'external_url' && !dto.applicationTarget.trim().startsWith('http')) {
      throw new BadRequestException('Application URL must start with http:// or https://');
    }
    if (dto.applicationMethod === 'email' && !dto.applicationTarget.includes('@')) {
      throw new BadRequestException('Application email must be valid.');
    }

    const row = await this.prisma.externalSchoolPostRequest.create({
      data: {
        externalAdminId,
        externalCategoryId: dto.externalCategoryId,
        schoolId: dto.schoolId,
        subCategoryId,
        contentType: 'job',
        title: dto.jobTitle.trim(),
        description: dto.jobDescription.trim(),
        companyName: dto.companyName.trim(),
        companyLogoUrl: dto.companyLogoUrl?.trim() || null,
        jobType: dto.jobType,
        workMode: dto.workMode,
        jobLocation: dto.location.trim(),
        eligibilityRequirements: dto.eligibilityRequirements.trim(),
        skillsRequired: dto.skillsRequired.trim(),
        experienceRequired: dto.experienceRequired.trim(),
        salaryStipend: dto.salaryStipend.trim(),
        applicationDeadline: deadline,
        applicationMethod: dto.applicationMethod,
        applicationTarget: dto.applicationTarget.trim(),
        contactPerson: dto.contactPerson?.trim() || null,
        contactEmail: dto.contactEmail?.trim() || null,
        contactPhone: dto.contactPhone?.trim() || null,
        postedByOrganization: dto.postedByOrganization.trim(),
        jobPublishStatus: dto.jobPublishStatus,
        applyButtonEnabled: dto.applyButtonEnabled,
        saveJobButtonEnabled: dto.saveJobButtonEnabled,
        applyButtonUrl: dto.applyButtonEnabled ? dto.applyButtonUrl?.trim() || null : null,
        status: 'pending',
        subcategoryStatus: null,
      },
      include: postInclude,
    });

    return row;
  }

  async createOffer(externalAdminId: string, dto: CreateExternalOfferRequestDto) {
    const link = await this.prisma.externalAdminCategory.findFirst({
      where: { externalAdminId, externalCategoryId: dto.externalCategoryId },
      include: { externalCategory: true },
    });
    if (!link?.externalCategory.isActive) {
      throw new ForbiddenException('You do not have access to this external category.');
    }
    const pipeline = await this.prisma.externalCategorySchoolPipelineRequest.findUnique({
      where: {
        externalAdminId_externalCategoryId_schoolId: {
          externalAdminId,
          externalCategoryId: dto.externalCategoryId,
          schoolId: dto.schoolId,
        },
      },
    });
    if (!pipeline || pipeline.status !== 'approved') {
      throw new ForbiddenException('Pipeline access must be approved for this school before posting.');
    }

    const validFrom = new Date(dto.validFrom.trim());
    const validUntil = new Date(dto.validUntil.trim());
    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime())) {
      throw new BadRequestException('Invalid offer validity dates.');
    }
    if (validUntil < validFrom) {
      throw new BadRequestException('Valid until must be on or after valid from.');
    }

    const redemptionUrl = dto.redemptionUrl.trim();
    if (!redemptionUrl.startsWith('http://') && !redemptionUrl.startsWith('https://')) {
      throw new BadRequestException('Redemption URL must start with http:// or https://');
    }

    const row = await this.prisma.externalSchoolPostRequest.create({
      data: {
        externalAdminId,
        externalCategoryId: dto.externalCategoryId,
        schoolId: dto.schoolId,
        subCategoryId: null,
        contentType: 'offer',
        title: dto.offerTitle.trim(),
        description: dto.description.trim(),
        companyName: dto.brandName.trim(),
        companyLogoUrl: dto.brandLogoUrl?.trim() || null,
        imageUrls: JSON.stringify([dto.bannerImageUrl.trim()]),
        eligibilityRequirements: dto.eligibility.trim(),
        postedByOrganization: dto.postedByOrganization.trim(),
        offerCategory: dto.offerCategory,
        originalPrice: dto.originalPrice?.trim() || null,
        offerPriceDiscount: dto.offerPriceDiscount.trim(),
        couponCode: dto.couponCode?.trim() || null,
        offerValidFrom: validFrom,
        offerValidUntil: validUntil,
        howToRedeem: dto.howToRedeem.trim(),
        redemptionUrl,
        termsAndConditions: dto.termsAndConditions.trim(),
        offerPublishStatus: dto.offerPublishStatus,
        studentIdRequired: false,
        status: 'pending',
        subcategoryStatus: null,
      },
      include: postInclude,
    });

    return row;
  }

  async createCampaign(externalAdminId: string, dto: CreateExternalCampaignRequestDto) {
    const link = await this.prisma.externalAdminCategory.findFirst({
      where: { externalAdminId, externalCategoryId: dto.externalCategoryId },
      include: { externalCategory: true },
    });
    if (!link?.externalCategory.isActive) {
      throw new ForbiddenException('You do not have access to this external category.');
    }
    const pipeline = await this.prisma.externalCategorySchoolPipelineRequest.findUnique({
      where: {
        externalAdminId_externalCategoryId_schoolId: {
          externalAdminId,
          externalCategoryId: dto.externalCategoryId,
          schoolId: dto.schoolId,
        },
      },
    });
    if (!pipeline || pipeline.status !== 'approved') {
      throw new ForbiddenException('Pipeline access must be approved for this school before posting.');
    }

    const startDate = new Date(dto.startDate.trim());
    const endDate = new Date(dto.endDate.trim());
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid campaign dates.');
    }
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after start date.');
    }

    let registrationDeadline: Date | null = null;
    if (dto.registrationDeadline?.trim()) {
      registrationDeadline = new Date(dto.registrationDeadline.trim());
      if (Number.isNaN(registrationDeadline.getTime())) {
        throw new BadRequestException('Invalid registration deadline.');
      }
    }

    const registrationUrl = dto.registrationUrl.trim();
    if (!registrationUrl.startsWith('http://') && !registrationUrl.startsWith('https://')) {
      throw new BadRequestException('Registration URL must start with http:// or https://');
    }

    if (dto.contactEmail?.trim() && !dto.contactEmail.includes('@')) {
      throw new BadRequestException('Contact email must be valid.');
    }

    const row = await this.prisma.externalSchoolPostRequest.create({
      data: {
        externalAdminId,
        externalCategoryId: dto.externalCategoryId,
        schoolId: dto.schoolId,
        subCategoryId: null,
        contentType: 'campaign',
        title: dto.campaignTitle.trim(),
        description: dto.description.trim(),
        companyName: dto.organizationName.trim(),
        companyLogoUrl: dto.companyLogoUrl?.trim() || null,
        imageUrls: JSON.stringify([dto.bannerImageUrl.trim()]),
        campaignType: dto.campaignType,
        campaignTargetAudience: dto.targetAudience.trim(),
        eligibilityRequirements: dto.eligibility.trim(),
        jobLocation: dto.locationOrOnline.trim(),
        offerValidFrom: startDate,
        offerValidUntil: endDate,
        redemptionUrl: registrationUrl,
        applicationDeadline: registrationDeadline,
        contactEmail: dto.contactEmail?.trim() || null,
        termsAndConditions: dto.termsAndConditions?.trim() || null,
        postedByOrganization: dto.postedByOrganization.trim(),
        offerPublishStatus: dto.publishStatus,
        status: 'pending',
        subcategoryStatus: null,
      },
      include: postInclude,
    });

    return row;
  }
}
