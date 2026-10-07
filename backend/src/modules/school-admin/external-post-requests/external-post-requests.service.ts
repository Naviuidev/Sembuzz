import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ExternalSchoolPostMessagesService,
  postInclude,
} from '../../external-school-post-messages/post-request-messages.service';
import { ExternalPostActionDto } from './dto/post-action.dto';
import { ExternalPostReplyDto } from './dto/post-reply.dto';

@Injectable()
export class SchoolAdminExternalPostRequestsService {
  constructor(
    private prisma: PrismaService,
    private threadService: ExternalSchoolPostMessagesService,
  ) {}

  async listForSchool(schoolId: string) {
    return this.prisma.externalSchoolPostRequest.findMany({
      where: { schoolId },
      include: postInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForSchool(id: string, schoolId: string) {
    const row = await this.threadService.getForSchool(id, schoolId);
    if (!row) throw new NotFoundException('External post request not found.');
    return row;
  }

  async pendingCount(schoolId: string) {
    const pending = await this.prisma.externalSchoolPostRequest.count({
      where: { schoolId, status: { in: ['pending', 'query'] } },
    });
    return { pending };
  }

  private async getRow(id: string, schoolId: string) {
    const row = await this.threadService.getForSchool(id, schoolId);
    if (!row) throw new NotFoundException('External post request not found.');
    return row;
  }

  async sendQuery(schoolAdminId: string, schoolId: string, id: string, dto: ExternalPostActionDto) {
    const message = dto.message?.trim();
    if (!message) throw new BadRequestException('Query message is required.');
    const row = await this.getRow(id, schoolId);
    if (['banned', 'approved'].includes(row.status)) {
      throw new BadRequestException('This post request can no longer be queried.');
    }
    await this.threadService.appendMessage(id, 'school_admin', message);
    const updated = await this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        status: 'query',
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
      },
      include: postInclude,
    });
    return updated;
  }

  async reply(schoolAdminId: string, schoolId: string, id: string, dto: ExternalPostReplyDto) {
    const message = dto.message.trim();
    const row = await this.getRow(id, schoolId);
    if (['banned', 'approved', 'rejected'].includes(row.status)) {
      throw new BadRequestException('This conversation is closed.');
    }
    await this.threadService.appendMessage(id, 'school_admin', message);
    const nextStatus = row.status === 'pending' ? 'query' : row.status;
    return this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
      },
      include: postInclude,
    });
  }

  async approve(schoolAdminId: string, schoolId: string, id: string, dto: ExternalPostActionDto) {
    const row = await this.getRow(id, schoolId);
    if (row.status === 'banned') {
      throw new BadRequestException('This post request is banned.');
    }
    const message = dto.message?.trim() || 'Your post has been approved for this school.';
    await this.threadService.appendMessage(id, 'school_admin', message);
    const updated = await this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        status: 'approved',
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
        subcategoryStatus:
          row.contentType === 'job' || row.contentType === 'offer' || row.contentType === 'campaign'
            ? null
            : row.subCategoryId
              ? 'pending'
              : null,
      },
      include: postInclude,
    });
    return updated;
  }

  async reject(schoolAdminId: string, schoolId: string, id: string, dto: ExternalPostActionDto) {
    await this.getRow(id, schoolId);
    const message = dto.message?.trim() || 'Your post was not approved for this school.';
    await this.threadService.appendMessage(id, 'school_admin', message);
    const updated = await this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
      },
      include: postInclude,
    });
    return updated;
  }

  async ban(schoolAdminId: string, schoolId: string, id: string, dto: ExternalPostActionDto) {
    await this.getRow(id, schoolId);
    const message =
      dto.message?.trim() || 'You are not permitted to submit posts for this school and category.';
    await this.threadService.appendMessage(id, 'school_admin', message);
    const updated = await this.prisma.externalSchoolPostRequest.update({
      where: { id },
      data: {
        status: 'banned',
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
      },
      include: postInclude,
    });
    return updated;
  }
}
