import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type PostMessageSenderRole = 'external_admin' | 'school_admin' | 'system';

const postInclude = {
  school: { select: { id: true, name: true, city: true, refNum: true, domain: true } },
  externalCategory: { select: { id: true, name: true } },
  externalAdmin: { select: { id: true, name: true, email: true, refNum: true } },
  threadMessages: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class ExternalSchoolPostMessagesService {
  constructor(private prisma: PrismaService) {}

  async appendMessage(postRequestId: string, senderRole: PostMessageSenderRole, body: string) {
    const trimmed = body.trim();
    if (!trimmed) return null;
    return this.prisma.externalSchoolPostRequestMessage.create({
      data: { postRequestId, senderRole, body: trimmed },
    });
  }

  getForSchool(id: string, schoolId: string) {
    return this.prisma.externalSchoolPostRequest.findFirst({
      where: { id, schoolId },
      include: postInclude,
    });
  }

  getForExternalAdmin(id: string, externalAdminId: string) {
    return this.prisma.externalSchoolPostRequest.findFirst({
      where: { id, externalAdminId },
      include: postInclude,
    });
  }

  lastMessageSenderRole(messages: Array<{ senderRole: string }>): PostMessageSenderRole | null {
    if (messages.length === 0) return null;
    return messages[messages.length - 1].senderRole as PostMessageSenderRole;
  }
}

export { postInclude };
