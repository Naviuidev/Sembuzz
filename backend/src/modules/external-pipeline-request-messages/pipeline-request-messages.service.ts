import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type PipelineMessageSenderRole = 'external_admin' | 'school_admin' | 'system';

const requestInclude = {
  school: { select: { id: true, name: true, city: true, refNum: true, domain: true } },
  externalCategory: { select: { id: true, name: true } },
  externalAdmin: { select: { id: true, name: true, email: true, refNum: true } },
  threadMessages: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class PipelineRequestMessagesService {
  constructor(private prisma: PrismaService) {}

  async appendMessage(
    pipelineRequestId: string,
    senderRole: PipelineMessageSenderRole,
    body: string,
  ) {
    const trimmed = body.trim();
    if (!trimmed) return null;
    return this.prisma.externalPipelineRequestMessage.create({
      data: {
        pipelineRequestId,
        senderRole,
        body: trimmed,
      },
    });
  }

  async getRequestForSchool(id: string, schoolId: string) {
    return this.prisma.externalCategorySchoolPipelineRequest.findFirst({
      where: { id, schoolId },
      include: requestInclude,
    });
  }

  async getRequestForExternalAdmin(id: string, externalAdminId: string) {
    return this.prisma.externalCategorySchoolPipelineRequest.findFirst({
      where: { id, externalAdminId },
      include: requestInclude,
    });
  }

  lastMessageSenderRole(
    messages: Array<{ senderRole: string }>,
  ): PipelineMessageSenderRole | null {
    if (messages.length === 0) return null;
    return messages[messages.length - 1].senderRole as PipelineMessageSenderRole;
  }
}
