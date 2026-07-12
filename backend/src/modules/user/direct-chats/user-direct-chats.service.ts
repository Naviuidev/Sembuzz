import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  canonicalDirectChatUserPair,
  conversationBlockState,
  DIRECT_CONVERSATION_USER_SELECT,
  DIRECT_MESSAGE_SELECT,
  INDIVIDUAL_MESSAGING_CODE,
  lastReadAtFieldForUser,
  lastReadAtForUser,
  peerStatusForConversation,
  type DirectChatPeerStatus,
} from '../../direct-chats/direct-chat.util';
import { chatMessagePreviewText, parseChatMessagePayload } from '../../chat-messages/chat-attachment.util';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';

@Injectable()
export class UserDirectChatsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, schoolId: true, status: true, name: true },
    });
    if (!user || user.status !== 'active') {
      throw new ForbiddenException('Account is not active.');
    }
    return user;
  }

  private async assertIndividualMessagingAvailable(schoolId: string) {
    const feature = await this.prisma.schoolFeature.findFirst({
      where: {
        schoolId,
        isEnabled: true,
        feature: { code: INDIVIDUAL_MESSAGING_CODE },
      },
      select: { id: true },
    });
    if (!feature) {
      throw new ForbiddenException('Direct messaging is not available for your school.');
    }

    const setting = await this.prisma.schoolDirectMessagingSetting.findUnique({
      where: { schoolId },
      select: { isEnabled: true },
    });
    if (setting && !setting.isEnabled) {
      throw new ForbiddenException('Direct messaging has been turned off by your category admin.');
    }
  }

  private formatConversation(
    row: {
      id: string;
      status: string;
      lastMessageAt: Date | null;
      updatedAt: Date;
      userOneId: string;
      userTwoId: string;
      userOneLastReadAt: Date | null;
      userTwoLastReadAt: Date | null;
      requestedByUserId: string;
      blockedByUserId?: string | null;
      userOne: { id: string; name: string; email: string; profilePicUrl: string | null };
      userTwo: { id: string; name: string; email: string; profilePicUrl: string | null };
      messages: Array<{ body: string; createdAt: Date; senderUserId: string; attachmentType: string | null; attachmentName: string | null }>;
    },
    currentUserId: string,
    unreadCount = 0,
  ) {
    const otherUser = row.userOne.id === currentUserId ? row.userTwo : row.userOne;
    const lastMessage = row.messages[0] ?? null;
    const peerStatus = peerStatusForConversation(row, currentUserId, otherUser.id);
    const blockState = conversationBlockState(row.blockedByUserId, currentUserId);
    return {
      id: row.id,
      status: row.status,
      peerStatus,
      lastMessageAt: row.lastMessageAt ?? row.updatedAt,
      otherUser,
      lastMessagePreview: lastMessage
        ? chatMessagePreviewText(
            lastMessage.body,
            lastMessage.attachmentType ?? null,
            lastMessage.attachmentName ?? null,
          )
        : null,
      lastMessageSenderUserId: lastMessage?.senderUserId ?? null,
      unreadCount,
      blockedByUserId: row.blockedByUserId ?? null,
      ...blockState,
    };
  }

  private async countUnreadForConversation(
    conversationId: string,
    currentUserId: string,
    lastReadAt: Date | null,
  ) {
    return this.prisma.directMessage.count({
      where: {
        conversationId,
        senderUserId: { not: currentUserId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
  }

  private async markConversationRead(
    conversation: { id: string; userOneId: string; userTwoId: string },
    userId: string,
    at: Date = new Date(),
  ) {
    const field = lastReadAtFieldForUser(userId, conversation);
    await this.prisma.directConversation.update({
      where: { id: conversation.id },
      data: { [field]: at },
    });
  }

  private async getConversationForUser(conversationId: string, userId: string, schoolId: string) {
    const conversation = await this.prisma.directConversation.findFirst({
      where: {
        id: conversationId,
        schoolId,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      select: {
        id: true,
        schoolId: true,
        userOneId: true,
        userTwoId: true,
        status: true,
        requestedByUserId: true,
        userOneLastReadAt: true,
        userTwoLastReadAt: true,
        blockedByUserId: true,
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    return conversation;
  }

  private assertAccepted(conversation: { status: string }) {
    if (conversation.status !== 'accepted') {
      throw new ForbiddenException(
        'You can only message after the other student accepts your chat request.',
      );
    }
  }

  private assertNotBlocked(
    conversation: { blockedByUserId: string | null },
    userId: string,
  ) {
    if (!conversation.blockedByUserId) return;
    if (conversation.blockedByUserId === userId) {
      throw new ForbiddenException('Unblock this conversation to send messages.');
    }
    throw new ForbiddenException('You cannot send messages in this conversation.');
  }

  async getAvailability(userId: string) {
    const user = await this.getActiveUser(userId);
    try {
      await this.assertIndividualMessagingAvailable(user.schoolId);
      return { available: true as const };
    } catch {
      return { available: false as const };
    }
  }

  async listStudents(userId: string, query?: string) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);

    const q = query?.trim();
    const students = await this.prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        status: 'active',
        id: { not: user.id },
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { firstName: { contains: q } },
                { lastName: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 100,
      select: DIRECT_CONVERSATION_USER_SELECT,
    });

    const conversations = await this.prisma.directConversation.findMany({
      where: {
        schoolId: user.schoolId,
        OR: [{ userOneId: user.id }, { userTwoId: user.id }],
      },
      select: {
        id: true,
        status: true,
        requestedByUserId: true,
        userOneId: true,
        userTwoId: true,
      },
    });

    const conversationByOtherId = new Map<string, (typeof conversations)[number]>();
    for (const c of conversations) {
      const otherId = c.userOneId === user.id ? c.userTwoId : c.userOneId;
      conversationByOtherId.set(otherId, c);
    }

    return students.map((student) => {
      const conversation = conversationByOtherId.get(student.id);
      let peerStatus: DirectChatPeerStatus = 'none';
      let conversationId: string | null = null;
      if (conversation) {
        conversationId = conversation.id;
        peerStatus = peerStatusForConversation(conversation, user.id, student.id);
      }
      return {
        user: student,
        conversationId,
        peerStatus,
      };
    });
  }

  async getUnreadCount(userId: string) {
    const user = await this.getActiveUser(userId);
    try {
      await this.assertIndividualMessagingAvailable(user.schoolId);
    } catch {
      return { unreadCount: 0, pendingIncomingCount: 0 };
    }

    const conversations = await this.prisma.directConversation.findMany({
      where: {
        schoolId: user.schoolId,
        OR: [{ userOneId: user.id }, { userTwoId: user.id }],
        status: { in: ['accepted', 'pending'] },
      },
      select: {
        id: true,
        status: true,
        userOneId: true,
        userTwoId: true,
        userOneLastReadAt: true,
        userTwoLastReadAt: true,
        requestedByUserId: true,
        blockedByUserId: true,
      },
    });

    let unreadCount = 0;
    let pendingIncomingCount = 0;

    for (const row of conversations) {
      const otherUserId = row.userOneId === user.id ? row.userTwoId : row.userOneId;
      const peerStatus = peerStatusForConversation(row, user.id, otherUserId);
      if (peerStatus === 'pending_incoming') {
        pendingIncomingCount += 1;
        continue;
      }
      if (peerStatus !== 'accepted') continue;
      if (row.blockedByUserId) continue;
      const lastReadAt = lastReadAtForUser(row, user.id);
      unreadCount += await this.countUnreadForConversation(row.id, user.id, lastReadAt);
    }

    return { unreadCount, pendingIncomingCount };
  }

  async listInbox(userId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);

    const rows = await this.prisma.directConversation.findMany({
      where: {
        schoolId: user.schoolId,
        OR: [{ userOneId: user.id }, { userTwoId: user.id }],
        status: { in: ['accepted', 'pending'] },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        status: true,
        lastMessageAt: true,
        updatedAt: true,
        userOneId: true,
        userTwoId: true,
        userOneLastReadAt: true,
        userTwoLastReadAt: true,
        requestedByUserId: true,
        blockedByUserId: true,
        userOne: { select: DIRECT_CONVERSATION_USER_SELECT },
        userTwo: { select: DIRECT_CONVERSATION_USER_SELECT },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true, senderUserId: true, attachmentType: true, attachmentName: true },
        },
      },
    });

    const items = await Promise.all(
      rows.map(async (row) => {
        const otherUser = row.userOne.id === user.id ? row.userTwo : row.userOne;
        const peerStatus = peerStatusForConversation(row, user.id, otherUser.id);
        if (peerStatus === 'pending_outgoing') {
          return null;
        }
        const lastReadAt = lastReadAtForUser(row, user.id);
        const unreadCount =
          peerStatus === 'accepted'
            ? await this.countUnreadForConversation(row.id, user.id, lastReadAt)
            : 1;
        return this.formatConversation(row, user.id, unreadCount);
      }),
    );

    return items
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        const aIncoming = a.peerStatus === 'pending_incoming' ? 1 : 0;
        const bIncoming = b.peerStatus === 'pending_incoming' ? 1 : 0;
        if (aIncoming !== bIncoming) return bIncoming - aIncoming;
        if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
  }

  async markRead(userId: string, conversationId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);
    const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
    await this.markConversationRead(conversation, user.id);
    return { ok: true as const };
  }

  async listConversations(userId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);

    const rows = await this.prisma.directConversation.findMany({
      where: {
        schoolId: user.schoolId,
        status: 'accepted',
        OR: [{ userOneId: user.id }, { userTwoId: user.id }],
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        status: true,
        lastMessageAt: true,
        updatedAt: true,
        userOneId: true,
        userTwoId: true,
        userOneLastReadAt: true,
        userTwoLastReadAt: true,
        requestedByUserId: true,
        blockedByUserId: true,
        userOne: { select: DIRECT_CONVERSATION_USER_SELECT },
        userTwo: { select: DIRECT_CONVERSATION_USER_SELECT },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true, senderUserId: true, attachmentType: true, attachmentName: true },
        },
      },
    });

    const items = await Promise.all(
      rows.map(async (row) => {
        const lastReadAt = lastReadAtForUser(row, user.id);
        const unreadCount = await this.countUnreadForConversation(row.id, user.id, lastReadAt);
        return this.formatConversation(row, user.id, unreadCount);
      }),
    );

    return items;
  }

  async sendRequest(userId: string, otherUserId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);

    if (otherUserId === user.id) {
      throw new BadRequestException('You cannot send a chat request to yourself.');
    }

    const other = await this.prisma.user.findFirst({
      where: { id: otherUserId, schoolId: user.schoolId, status: 'active' },
      select: DIRECT_CONVERSATION_USER_SELECT,
    });
    if (!other) {
      throw new NotFoundException('Student not found at your school.');
    }

    const [userOneId, userTwoId] = canonicalDirectChatUserPair(user.id, other.id);

    const existing = await this.prisma.directConversation.findUnique({
      where: {
        schoolId_userOneId_userTwoId: { schoolId: user.schoolId, userOneId, userTwoId },
      },
      select: {
        id: true,
        status: true,
        requestedByUserId: true,
        userOneId: true,
        userTwoId: true,
      },
    });

    if (existing) {
      const peerStatus = peerStatusForConversation(existing, user.id, other.id);
      if (peerStatus === 'accepted') {
        return {
          conversationId: existing.id,
          peerStatus,
          message: 'You are already connected. You can send messages.',
        };
      }
      if (peerStatus === 'pending_outgoing') {
        throw new BadRequestException('Your chat request is already pending.');
      }
      if (peerStatus === 'pending_incoming') {
        throw new BadRequestException('This student has already sent you a request. Please accept it.');
      }
      if (peerStatus === 'declined') {
        const updated = await this.prisma.directConversation.update({
          where: { id: existing.id },
          data: {
            status: 'pending',
            requestedByUserId: user.id,
            respondedAt: null,
          },
          select: { id: true },
        });
        return {
          conversationId: updated.id,
          peerStatus: 'pending_outgoing' as const,
          message: 'Chat request sent.',
        };
      }
    }

    const created = await this.prisma.directConversation.create({
      data: {
        schoolId: user.schoolId,
        userOneId,
        userTwoId,
        status: 'pending',
        requestedByUserId: user.id,
      },
      select: { id: true },
    });

    return {
      conversationId: created.id,
      peerStatus: 'pending_outgoing' as const,
      message: 'Chat request sent. You can message after they accept.',
    };
  }

  async acceptRequest(userId: string, conversationId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);

    const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);

    if (conversation.status === 'accepted') {
      return { conversationId: conversation.id, peerStatus: 'accepted' as const };
    }
    if (conversation.status !== 'pending') {
      throw new BadRequestException('This chat request is no longer available.');
    }
    if (conversation.requestedByUserId === user.id) {
      throw new BadRequestException('You cannot accept your own chat request.');
    }

    await this.prisma.directConversation.update({
      where: { id: conversationId },
      data: {
        status: 'accepted',
        respondedAt: new Date(),
        [lastReadAtFieldForUser(user.id, conversation)]: new Date(),
      },
    });

    return {
      conversationId,
      peerStatus: 'accepted' as const,
      message: 'Chat request accepted. You can now send messages.',
    };
  }

  async listMessages(userId: string, conversationId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);
    const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
    this.assertAccepted(conversation);

    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: DIRECT_MESSAGE_SELECT,
    });

    await this.markConversationRead(conversation, user.id);

    return {
      messages,
      blockedByUserId: conversation.blockedByUserId,
      ...conversationBlockState(conversation.blockedByUserId, user.id),
    };
  }

  async sendMessage(userId: string, conversationId: string, dto: SendDirectMessageDto) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);
    const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
    this.assertAccepted(conversation);
    this.assertNotBlocked(conversation, user.id);

    const payload = parseChatMessagePayload(dto);

    if (payload.replyToMessageId) {
      const reply = await this.prisma.directMessage.findFirst({
        where: { id: payload.replyToMessageId, conversationId },
        select: { id: true },
      });
      if (!reply) {
        throw new BadRequestException('The message you are replying to was not found.');
      }
    }

    const now = new Date();
    const readField = lastReadAtFieldForUser(user.id, conversation);
    const [message] = await this.prisma.$transaction([
      this.prisma.directMessage.create({
        data: {
          conversationId,
          senderUserId: user.id,
          body: payload.body,
          attachmentUrl: payload.attachmentUrl,
          attachmentType: payload.attachmentType,
          attachmentName: payload.attachmentName,
          replyToMessageId: payload.replyToMessageId,
        },
        select: DIRECT_MESSAGE_SELECT,
      }),
      this.prisma.directConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now, [readField]: now },
      }),
    ]);

    return message;
  }

  async blockConversation(userId: string, conversationId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);
    const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
    this.assertAccepted(conversation);

    if (conversation.blockedByUserId === user.id) {
      return {
        conversationId,
        isBlockedByMe: true,
        isBlockedByPeer: false,
        message: 'This conversation is already blocked.',
      };
    }
    if (conversation.blockedByUserId && conversation.blockedByUserId !== user.id) {
      throw new ForbiddenException('You cannot block this conversation.');
    }

    await this.prisma.directConversation.update({
      where: { id: conversationId },
      data: { blockedByUserId: user.id, blockedAt: new Date() },
    });

    return {
      conversationId,
      isBlockedByMe: true,
      isBlockedByPeer: false,
      message: 'Conversation blocked. You will not receive new messages from this student.',
    };
  }

  async unblockConversation(userId: string, conversationId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertIndividualMessagingAvailable(user.schoolId);
    const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);

    if (!conversation.blockedByUserId) {
      return {
        conversationId,
        isBlockedByMe: false,
        isBlockedByPeer: false,
        message: 'This conversation is not blocked.',
      };
    }
    if (conversation.blockedByUserId !== user.id) {
      throw new ForbiddenException('Only the person who blocked this conversation can unblock it.');
    }

    await this.prisma.directConversation.update({
      where: { id: conversationId },
      data: { blockedByUserId: null, blockedAt: null },
    });

    return {
      conversationId,
      isBlockedByMe: false,
      isBlockedByPeer: false,
      message: 'Conversation unblocked. You can send messages again.',
    };
  }
}
