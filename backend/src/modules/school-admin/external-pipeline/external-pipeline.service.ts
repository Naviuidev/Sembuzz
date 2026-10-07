import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PipelineRequestMessagesService } from '../../external-pipeline-request-messages/pipeline-request-messages.service';
import { PipelineActionMessageDto } from './dto/pipeline-action.dto';
import { PipelineReplyDto } from './dto/pipeline-reply.dto';

const requestInclude = {
  school: { select: { id: true, name: true, city: true, refNum: true, domain: true } },
  externalCategory: { select: { id: true, name: true } },
  externalAdmin: { select: { id: true, name: true, email: true, refNum: true } },
  threadMessages: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class SchoolAdminExternalPipelineService {
  constructor(
    private prisma: PrismaService,
    private threadService: PipelineRequestMessagesService,
  ) {}

  async listForSchool(schoolId: string) {
    return this.prisma.externalCategorySchoolPipelineRequest.findMany({
      where: { schoolId },
      include: requestInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getForSchool(id: string, schoolId: string) {
    const row = await this.threadService.getRequestForSchool(id, schoolId);
    if (!row) throw new NotFoundException('Pipeline request not found.');
    return row;
  }

  async pendingCount(schoolId: string) {
    const pending = await this.prisma.externalCategorySchoolPipelineRequest.count({
      where: { schoolId, status: 'pending' },
    });
    return { pending };
  }

  private async getForSchoolRow(id: string, schoolId: string) {
    const row = await this.prisma.externalCategorySchoolPipelineRequest.findFirst({
      where: { id, schoolId },
      include: requestInclude,
    });
    if (!row) throw new NotFoundException('Pipeline request not found.');
    return row;
  }

  async sendQuery(schoolAdminId: string, schoolId: string, id: string, dto: PipelineActionMessageDto) {
    const message = dto.message?.trim();
    if (!message) throw new BadRequestException('Query message is required.');
    const row = await this.getForSchoolRow(id, schoolId);
    if (row.status === 'banned' || row.status === 'approved') {
      throw new BadRequestException('This request can no longer be queried.');
    }
    await this.threadService.appendMessage(id, 'school_admin', message);
    const updated = await this.prisma.externalCategorySchoolPipelineRequest.update({
      where: { id },
      data: {
        status: 'query',
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
      },
      include: requestInclude,
    });
    return updated;
  }

  async reply(schoolAdminId: string, schoolId: string, id: string, dto: PipelineReplyDto) {
    const message = dto.message.trim();
    const row = await this.getForSchoolRow(id, schoolId);
    if (['banned', 'approved', 'rejected'].includes(row.status)) {
      throw new BadRequestException('This conversation is closed.');
    }
    await this.threadService.appendMessage(id, 'school_admin', message);
    const nextStatus = row.status === 'pending' ? 'query' : row.status;
    return this.prisma.externalCategorySchoolPipelineRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
      },
      include: requestInclude,
    });
  }

  async approve(schoolAdminId: string, schoolId: string, id: string, dto: PipelineActionMessageDto) {
    const row = await this.getForSchoolRow(id, schoolId);
    const message = dto.message?.trim() || 'Your pipeline access request has been approved.';
    await this.threadService.appendMessage(id, 'school_admin', message);
    const updated = await this.prisma.externalCategorySchoolPipelineRequest.update({
      where: { id },
      data: {
        status: 'approved',
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
      },
      include: requestInclude,
    });
    return updated;
  }

  async reject(schoolAdminId: string, schoolId: string, id: string, dto: PipelineActionMessageDto) {
    const row = await this.getForSchoolRow(id, schoolId);
    const message = dto.message?.trim() || 'Your pipeline access request was not approved at this time.';
    await this.threadService.appendMessage(id, 'school_admin', message);
    const updated = await this.prisma.externalCategorySchoolPipelineRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
      },
      include: requestInclude,
    });
    return updated;
  }

  async ban(schoolAdminId: string, schoolId: string, id: string, dto: PipelineActionMessageDto) {
    const row = await this.getForSchoolRow(id, schoolId);
    const message =
      dto.message?.trim() ||
      'You are not permitted to request pipeline access for this school and category.';
    await this.threadService.appendMessage(id, 'school_admin', message);
    const updated = await this.prisma.externalCategorySchoolPipelineRequest.update({
      where: { id },
      data: {
        status: 'banned',
        schoolAdminMessage: message,
        reviewedBySchoolAdminId: schoolAdminId,
        reviewedAt: new Date(),
      },
      include: requestInclude,
    });
    return updated;
  }
}
