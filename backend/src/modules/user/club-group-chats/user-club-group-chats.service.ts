import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SendClubGroupMessageDto } from './dto/send-club-group-message.dto';
import {
  CLUB_GROUP_MESSAGE_SELECT,
  isClubGroupMessageMode,
} from '../../club-group-chats/club-group-message.util';
import { parseChatMessagePayload } from '../../chat-messages/chat-attachment.util';

const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';

@Injectable()
export class UserClubGroupChatsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        schoolId: true,
        status: true,
        name: true,
        email: true,
        school: { select: { name: true } },
      },
    });
    if (!user || user.status !== 'active') {
      throw new ForbiddenException('Account is not active.');
    }
    return user;
  }

  private async assertGroupMessagingEnabled(schoolId: string) {
    const enabled = await this.prisma.schoolFeature.findFirst({
      where: {
        schoolId,
        isEnabled: true,
        feature: { code: GROUP_MESSAGING_CODE },
      },
      select: { id: true },
    });
    if (!enabled) {
      throw new ForbiddenException('Group messaging is not available for your school.');
    }
  }

  private async assertApprovedMember(userId: string, groupChatId: string) {
    const membership = await this.prisma.clubGroupMembership.findUnique({
      where: { groupChatId_userId: { groupChatId, userId } },
      select: { status: true },
    });
    if (!membership || membership.status !== 'approved') {
      throw new ForbiddenException(
        'You must be approved to access this group chat. Request to join and wait for category admin approval.',
      );
    }
  }

  private async getChatForUser(userId: string, groupChatId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertGroupMessagingEnabled(user.schoolId);

    const chat = await this.prisma.clubGroupChat.findFirst({
      where: {
        id: groupChatId,
        schoolId: user.schoolId,
        isEnabled: true,
      },
      select: {
        id: true,
        clubKey: true,
        pageName: true,
        icon: true,
      },
    });
    if (!chat) throw new NotFoundException('Group chat not found.');
    return { user, chat };
  }

  /** Chats the user may join (with membership status). */
  async listJoinable(userId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertGroupMessagingEnabled(user.schoolId);

    const chats = await this.prisma.clubGroupChat.findMany({
      where: { schoolId: user.schoolId, isEnabled: true },
      orderBy: { pageName: 'asc' },
      select: {
        id: true,
        clubKey: true,
        pageName: true,
        icon: true,
        messageMode: true,
        memberships: {
          where: { userId: user.id },
          select: { id: true, status: true, createdAt: true },
          take: 1,
        },
      },
    });

    return chats.map((c) => ({
      id: c.id,
      clubKey: c.clubKey,
      pageName: c.pageName,
      icon: c.icon,
      messageMode: isClubGroupMessageMode(c.messageMode) ? c.messageMode : 'members',
      membershipStatus: c.memberships[0]?.status ?? null,
      membershipId: c.memberships[0]?.id ?? null,
      requestedAt: c.memberships[0]?.createdAt ?? null,
    }));
  }

  async requestJoin(userId: string, groupChatId: string) {
    const { user, chat } = await this.getChatForUser(userId, groupChatId);

    const existing = await this.prisma.clubGroupMembership.findUnique({
      where: { groupChatId_userId: { groupChatId, userId: user.id } },
    });
    if (existing) {
      if (existing.status === 'pending') {
        throw new BadRequestException('Your join request is already pending approval.');
      }
      if (existing.status === 'approved') {
        throw new BadRequestException('You are already a member of this group.');
      }
      if (existing.status === 'banned') {
        throw new ForbiddenException('You are not allowed to join this group. Contact your category admin.');
      }
    }

    const membership = await this.prisma.clubGroupMembership.create({
      data: {
        groupChatId: chat.id,
        userId: user.id,
        schoolId: user.schoolId,
        status: 'pending',
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        groupChat: { select: { id: true, pageName: true, icon: true } },
      },
    });

    return membership;
  }

  /** Approved group chats only (for chat widget after approval). */
  async listForUser(userId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertGroupMessagingEnabled(user.schoolId);

    const memberships = await this.prisma.clubGroupMembership.findMany({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
        status: 'approved',
        groupChat: { isEnabled: true },
      },
      orderBy: { groupChat: { pageName: 'asc' } },
      select: {
        groupChat: {
          select: {
            id: true,
            clubKey: true,
            pageName: true,
            icon: true,
            messageMode: true,
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.groupChat,
      messageMode: isClubGroupMessageMode(m.groupChat.messageMode)
        ? m.groupChat.messageMode
        : 'members',
    }));
  }

  async listMessages(userId: string, groupChatId: string) {
    await this.getChatForUser(userId, groupChatId);
    await this.assertApprovedMember(userId, groupChatId);

    return this.prisma.clubGroupMessage.findMany({
      where: { groupChatId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: CLUB_GROUP_MESSAGE_SELECT,
    });
  }

  async sendMessage(userId: string, groupChatId: string, dto: SendClubGroupMessageDto) {
    const { user } = await this.getChatForUser(userId, groupChatId);
    await this.assertApprovedMember(userId, groupChatId);

    const chat = await this.prisma.clubGroupChat.findFirst({
      where: { id: groupChatId, schoolId: user.schoolId, isEnabled: true },
      select: { messageMode: true },
    });
    const messageMode = isClubGroupMessageMode(chat?.messageMode ?? '')
      ? chat!.messageMode
      : 'members';
    if (messageMode === 'admin_only') {
      throw new ForbiddenException(
        'Only category admins can send messages in this group. You can read messages from your admin.',
      );
    }

    const payload = parseChatMessagePayload(dto);

    if (payload.replyToMessageId) {
      const reply = await this.prisma.clubGroupMessage.findFirst({
        where: { id: payload.replyToMessageId, groupChatId },
        select: { id: true },
      });
      if (!reply) {
        throw new BadRequestException('The message you are replying to was not found.');
      }
    }

    return this.prisma.clubGroupMessage.create({
      data: {
        groupChatId,
        userId: user.id,
        body: payload.body,
        attachmentUrl: payload.attachmentUrl,
        attachmentType: payload.attachmentType,
        attachmentName: payload.attachmentName,
        replyToMessageId: payload.replyToMessageId,
      },
      select: CLUB_GROUP_MESSAGE_SELECT,
    });
  }
}
