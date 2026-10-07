import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PipelineRequestMessagesService } from '../../external-pipeline-request-messages/pipeline-request-messages.service';
import { EmailService } from '../../super-admin/schools/email.service';
import { CreatePipelineRequestsDto } from './dto/create-pipeline-requests.dto';
import { ExternalPipelineReplyDto } from './dto/pipeline-reply.dto';

const requestInclude = {
  school: { select: { id: true, name: true, city: true, refNum: true, domain: true } },
  externalCategory: { select: { id: true, name: true } },
  externalAdmin: { select: { id: true, name: true, email: true, refNum: true } },
  threadMessages: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class ExternalAdminPipelineService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private threadService: PipelineRequestMessagesService,
  ) {}

  async listSchools() {
    return this.prisma.school.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true, refNum: true, domain: true },
      orderBy: { name: 'asc' },
    });
  }

  async listMyCategories(externalAdminId: string) {
    const links = await this.prisma.externalAdminCategory.findMany({
      where: { externalAdminId },
      include: { externalCategory: true },
    });
    return links
      .map((l) => l.externalCategory)
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  async listRequests(externalAdminId: string) {
    return this.prisma.externalCategorySchoolPipelineRequest.findMany({
      where: { externalAdminId },
      include: requestInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async summary(externalAdminId: string) {
    const [pending, requests] = await Promise.all([
      this.prisma.externalCategorySchoolPipelineRequest.count({
        where: { externalAdminId, status: 'pending' },
      }),
      this.prisma.externalCategorySchoolPipelineRequest.findMany({
        where: {
          externalAdminId,
          status: { in: ['pending', 'query'] },
        },
        include: { threadMessages: { orderBy: { createdAt: 'asc' } } },
      }),
    ]);
    const awaitingExternalReply = requests.filter((r) => {
      const last = this.threadService.lastMessageSenderRole(r.threadMessages);
      return last === 'school_admin';
    }).length;
    return { pending, schoolReplies: awaitingExternalReply };
  }

  async getRequest(externalAdminId: string, id: string) {
    const row = await this.threadService.getRequestForExternalAdmin(id, externalAdminId);
    if (!row) throw new NotFoundException('Pipeline request not found.');
    return row;
  }

  async reply(externalAdminId: string, id: string, dto: ExternalPipelineReplyDto) {
    const row = await this.threadService.getRequestForExternalAdmin(id, externalAdminId);
    if (!row) throw new NotFoundException('Pipeline request not found.');
    if (row.status === 'banned' || row.status === 'approved' || row.status === 'rejected') {
      throw new BadRequestException('This conversation is closed.');
    }
    const message = dto.message.trim();
    await this.threadService.appendMessage(id, 'external_admin', message);
    return this.prisma.externalCategorySchoolPipelineRequest.update({
      where: { id },
      data: { updatedAt: new Date() },
      include: requestInclude,
    });
  }

  async createRequests(externalAdminId: string, dto: CreatePipelineRequestsDto) {
    const link = await this.prisma.externalAdminCategory.findFirst({
      where: { externalAdminId, externalCategoryId: dto.externalCategoryId },
      include: { externalCategory: true },
    });
    if (!link?.externalCategory.isActive) {
      throw new ForbiddenException('You do not have access to this external category.');
    }

    const admin = await this.prisma.externalAdmin.findUnique({ where: { id: externalAdminId } });
    if (!admin?.isActive) throw new ForbiddenException('Account is not active.');

    const schoolIds = [...new Set(dto.schoolIds)];
    const schools = await this.prisma.school.findMany({
      where: { id: { in: schoolIds }, isActive: true },
    });
    if (schools.length !== schoolIds.length) {
      throw new BadRequestException('One or more schools were not found or are inactive.');
    }

    const created: Array<Record<string, unknown>> = [];
    for (const school of schools) {
      const existing = await this.prisma.externalCategorySchoolPipelineRequest.findUnique({
        where: {
          externalAdminId_externalCategoryId_schoolId: {
            externalAdminId,
            externalCategoryId: dto.externalCategoryId,
            schoolId: school.id,
          },
        },
      });
      if (existing) {
        if (existing.status === 'banned') {
          throw new BadRequestException(
            `You are blocked from requesting pipeline access to ${school.name} for this category.`,
          );
        }
        if (existing.status === 'pending' || existing.status === 'query') {
          continue;
        }
        if (existing.status === 'approved') {
          continue;
        }
        const initialMessage = dto.message?.trim() || null;
        const updated = await this.prisma.externalCategorySchoolPipelineRequest.update({
          where: { id: existing.id },
          data: {
            status: 'pending',
            requestMessage: initialMessage,
            schoolAdminMessage: null,
            reviewedAt: null,
            reviewedBySchoolAdminId: null,
          },
          include: requestInclude,
        });
        if (initialMessage) {
          await this.threadService.appendMessage(existing.id, 'external_admin', initialMessage);
        }
        const withThread = await this.prisma.externalCategorySchoolPipelineRequest.findUnique({
          where: { id: existing.id },
          include: requestInclude,
        });
        created.push(withThread ?? updated);
        await this.notifySchoolAdmins(updated, admin, link.externalCategory.name);
        continue;
      }

      const initialMessage = dto.message?.trim() || null;
      const row = await this.prisma.externalCategorySchoolPipelineRequest.create({
        data: {
          externalAdminId,
          externalCategoryId: dto.externalCategoryId,
          schoolId: school.id,
          requestMessage: initialMessage,
          status: 'pending',
        },
        include: requestInclude,
      });
      if (initialMessage) {
        await this.threadService.appendMessage(row.id, 'external_admin', initialMessage);
      }
      const withThread = await this.prisma.externalCategorySchoolPipelineRequest.findUnique({
        where: { id: row.id },
        include: requestInclude,
      });
      created.push(withThread ?? row);
      await this.notifySchoolAdmins(row, admin, link.externalCategory.name);
    }

    if (created.length === 0) {
      throw new BadRequestException('No new requests were created. Requests may already be pending or approved.');
    }

    return { created, count: created.length };
  }

  private async notifySchoolAdmins(
    request: {
      schoolId: string;
      requestMessage: string | null;
      school: { name: string };
    },
    externalAdmin: { name: string; email: string; refNum: string },
    categoryName: string,
  ) {
    const schoolAdmins = await this.prisma.schoolAdmin.findMany({
      where: { schoolId: request.schoolId, isActive: true },
      select: { email: true, name: true },
    });
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    for (const sa of schoolAdmins) {
      try {
        await this.emailService.sendExternalPipelineRequestToSchoolAdmin(
          sa.email,
          sa.name,
          request.school.name,
          externalAdmin.name,
          externalAdmin.email,
          categoryName,
          request.requestMessage,
          `${frontend}/school-admin/external-config`,
        );
      } catch (e) {
        console.error('[ExternalAdminPipeline] school admin notify failed', e);
      }
    }
  }
}
