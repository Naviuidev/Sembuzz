import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  DIRECT_CONVERSATION_USER_SELECT,
  DIRECT_MESSAGE_SELECT,
} from '../../direct-chats/direct-chat.util';

@Injectable()
export class SubCategoryAdminDirectChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(schoolId: string) {
    const row = await this.prisma.schoolDirectMessagingSetting.findUnique({
      where: { schoolId },
      select: { isEnabled: true },
    });
    return { isEnabled: row?.isEnabled ?? true };
  }

  async updateSetting(schoolId: string, isEnabled: boolean) {
    const row = await this.prisma.schoolDirectMessagingSetting.upsert({
      where: { schoolId },
      create: { schoolId, isEnabled },
      update: { isEnabled },
      select: { isEnabled: true },
    });
    return row;
  }

  async listConversations(schoolId: string) {
    const rows = await this.prisma.directConversation.findMany({
      where: { schoolId },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        status: true,
        lastMessageAt: true,
        updatedAt: true,
        userOne: { select: DIRECT_CONVERSATION_USER_SELECT },
        userTwo: { select: DIRECT_CONVERSATION_USER_SELECT },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      lastMessageAt: row.lastMessageAt ?? row.updatedAt,
      messageCount: row._count.messages,
      userOne: row.userOne,
      userTwo: row.userTwo,
      lastMessagePreview: row.messages[0]?.body ?? null,
    }));
  }

  async listMessages(schoolId: string, conversationId: string) {
    const conversation = await this.prisma.directConversation.findFirst({
      where: { id: conversationId, schoolId },
      select: {
        id: true,
        userOne: { select: DIRECT_CONVERSATION_USER_SELECT },
        userTwo: { select: DIRECT_CONVERSATION_USER_SELECT },
      },
    });
    if (!conversation) {
      return null;
    }

    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: DIRECT_MESSAGE_SELECT,
    });

    return { conversation, messages };
  }
}
