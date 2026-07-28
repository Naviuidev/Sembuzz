import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CLUB_GROUP_MESSAGE_SELECT,
  isClubGroupMessageMode,
  type ClubGroupMessageMode,
} from '../../club-group-chats/club-group-message.util';
import { parseChatMessagePayload } from '../../chat-messages/chat-attachment.util';
import { SubCategoryAdminSendClubGroupMessageDto } from './dto/send-club-group-message.dto';

@Injectable()
export class SubCategoryAdminClubGroupChatsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChatForSchool(groupChatId: string, schoolId: string) {
    const chat = await this.prisma.clubGroupChat.findFirst({
      where: { id: groupChatId, schoolId, isEnabled: true },
      select: {
        id: true,
        clubKey: true,
        pageName: true,
        icon: true,
        messageMode: true,
      },
    });
    if (!chat) throw new NotFoundException('Group chat not found.');
    return chat;
  }

  async listForSchool(schoolId: string) {
    const chats = await this.prisma.clubGroupChat.findMany({
      where: { schoolId, isEnabled: true },
      orderBy: { pageName: 'asc' },
      select: {
        id: true,
        clubKey: true,
        pageName: true,
        icon: true,
        messageMode: true,
        _count: {
          select: {
            memberships: { where: { status: 'approved' } },
          },
        },
      },
    });

    return chats.map((chat) => ({
      id: chat.id,
      clubKey: chat.clubKey,
      pageName: chat.pageName,
      icon: chat.icon,
      messageMode: isClubGroupMessageMode(chat.messageMode) ? chat.messageMode : 'members',
      approvedMemberCount: chat._count.memberships,
    }));
  }

  async updateMessageMode(
    groupChatId: string,
    schoolId: string,
    messageMode: ClubGroupMessageMode,
  ) {
    await this.getChatForSchool(groupChatId, schoolId);

    const updated = await this.prisma.clubGroupChat.update({
      where: { id: groupChatId },
      data: { messageMode },
      select: {
        id: true,
        clubKey: true,
        pageName: true,
        icon: true,
        messageMode: true,
      },
    });

    return {
      ...updated,
      messageMode: isClubGroupMessageMode(updated.messageMode)
        ? updated.messageMode
        : 'members',
    };
  }

  async listApprovedMembers(groupChatId: string, schoolId: string) {
    await this.getChatForSchool(groupChatId, schoolId);

    return this.prisma.clubGroupMembership.findMany({
      where: { groupChatId, schoolId, status: 'approved' },
      orderBy: { user: { name: 'asc' } },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicUrl: true,
          },
        },
        reviewedAt: true,
      },
    });
  }

  async listMessages(groupChatId: string, schoolId: string) {
    await this.getChatForSchool(groupChatId, schoolId);

    return this.prisma.clubGroupMessage.findMany({
      where: { groupChatId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: CLUB_GROUP_MESSAGE_SELECT,
    });
  }

  async sendMessage(
    groupChatId: string,
    schoolId: string,
    subCategoryAdminId: string,
    dto: SubCategoryAdminSendClubGroupMessageDto,
  ) {
    await this.getChatForSchool(groupChatId, schoolId);
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
        subCategoryAdminId,
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
