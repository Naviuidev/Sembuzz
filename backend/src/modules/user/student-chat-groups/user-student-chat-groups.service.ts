import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  chatMessagePreviewText,
  parseChatMessagePayload,
} from '../../chat-messages/chat-attachment.util';
import {
  isStudentChatGroupVisibility,
  STUDENT_CHAT_MESSAGE_SELECT,
} from '../../student-chat-groups/student-chat-message.util';
import { CreateStudentChatGroupDto } from './dto/create-student-chat-group.dto';
import { SendStudentChatGroupMessageDto } from './dto/send-student-chat-group-message.dto';

const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';

@Injectable()
export class UserStudentChatGroupsService {
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
        profilePicUrl: true,
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

  private async getActiveMembership(userId: string, groupId: string) {
    const membership = await this.prisma.studentChatGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true, status: true, role: true, lastReadAt: true },
    });
    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('You are not a member of this group.');
    }
    return membership;
  }

  private async getGroupForUser(userId: string, groupId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertGroupMessagingEnabled(user.schoolId);

    const group = await this.prisma.studentChatGroup.findFirst({
      where: {
        id: groupId,
        schoolId: user.schoolId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        visibility: true,
        createdByUserId: true,
        lastMessageAt: true,
        createdAt: true,
        _count: { select: { members: { where: { status: 'active' } } } },
      },
    });
    if (!group) throw new NotFoundException('Group not found.');
    return { user, group };
  }

  private formatGroupRow(
    group: {
      id: string;
      name: string;
      description: string | null;
      avatarUrl: string | null;
      visibility: string;
      createdByUserId: string | null;
      lastMessageAt: Date | null;
      createdAt: Date;
      _count: { members: number };
    },
    extras: {
      memberRole?: string | null;
      isMember?: boolean;
      isOwner?: boolean;
      unreadCount?: number;
      lastMessagePreview?: string | null;
      lastMessageSenderName?: string | null;
    } = {},
  ) {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      visibility: isStudentChatGroupVisibility(group.visibility) ? group.visibility : 'public',
      createdByUserId: group.createdByUserId,
      lastMessageAt: group.lastMessageAt ?? group.createdAt,
      memberCount: group._count.members,
      memberRole: extras.memberRole ?? null,
      isMember: extras.isMember ?? false,
      isOwner: extras.isOwner ?? false,
      unreadCount: extras.unreadCount ?? 0,
      lastMessagePreview: extras.lastMessagePreview ?? null,
      lastMessageSenderName: extras.lastMessageSenderName ?? null,
    };
  }

  async getUnreadCount(userId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertGroupMessagingEnabled(user.schoolId);

    const memberships = await this.prisma.studentChatGroupMember.findMany({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
        status: 'active',
        group: { isActive: true },
      },
      select: {
        lastReadAt: true,
        groupId: true,
      },
    });

    if (memberships.length === 0) {
      return { unreadCount: 0 };
    }

    let total = 0;
    for (const m of memberships) {
      const count = await this.prisma.studentChatGroupMessage.count({
        where: {
          groupId: m.groupId,
          createdAt: m.lastReadAt ? { gt: m.lastReadAt } : undefined,
          NOT: { senderUserId: user.id },
        },
      });
      total += count;
    }

    return { unreadCount: total };
  }

  /** Groups the student is an active member of (inbox). */
  async listInbox(userId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertGroupMessagingEnabled(user.schoolId);

    const memberships = await this.prisma.studentChatGroupMember.findMany({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
        status: 'active',
        group: { isActive: true },
      },
      orderBy: { group: { lastMessageAt: 'desc' } },
      select: {
        role: true,
        lastReadAt: true,
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            avatarUrl: true,
            visibility: true,
            createdByUserId: true,
            lastMessageAt: true,
            createdAt: true,
            _count: { select: { members: { where: { status: 'active' } } } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                body: true,
                attachmentType: true,
                attachmentName: true,
                createdAt: true,
                sender: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const rows = await Promise.all(
      memberships.map(async (m) => {
        const last = m.group.messages[0] ?? null;
        const unreadCount = await this.prisma.studentChatGroupMessage.count({
          where: {
            groupId: m.group.id,
            createdAt: m.lastReadAt ? { gt: m.lastReadAt } : undefined,
            NOT: { senderUserId: user.id },
          },
        });
        return this.formatGroupRow(m.group, {
          memberRole: m.role,
          isMember: true,
          isOwner: m.group.createdByUserId === user.id,
          unreadCount,
          lastMessagePreview: last
            ? chatMessagePreviewText(last.body, last.attachmentType, last.attachmentName)
            : null,
          lastMessageSenderName: last?.sender.name ?? null,
        });
      }),
    );

    rows.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
    return rows;
  }

  /** All active groups at the student's school (browse / join / filter). */
  async listDiscoverable(userId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertGroupMessagingEnabled(user.schoolId);

    const groups = await this.prisma.studentChatGroup.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        visibility: true,
        createdByUserId: true,
        lastMessageAt: true,
        createdAt: true,
        _count: { select: { members: { where: { status: 'active' } } } },
        members: {
          where: { userId: user.id, status: 'active' },
          select: { role: true, lastReadAt: true },
          take: 1,
        },
      },
    });

    return groups.map((group) => {
      const membership = group.members[0] ?? null;
      return this.formatGroupRow(group, {
        memberRole: membership?.role ?? null,
        isMember: !!membership,
        isOwner: group.createdByUserId === user.id,
      });
    });
  }

  async createGroup(userId: string, dto: CreateStudentChatGroupDto) {
    const user = await this.getActiveUser(userId);
    await this.assertGroupMessagingEnabled(user.schoolId);

    const name = dto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Group name must be at least 2 characters.');
    }

    const visibility =
      dto.visibility && isStudentChatGroupVisibility(dto.visibility) ? dto.visibility : 'public';

    const group = await this.prisma.$transaction(async (tx) => {
      const created = await tx.studentChatGroup.create({
        data: {
          schoolId: user.schoolId,
          name,
          description: dto.description?.trim() || null,
          visibility,
          createdByUserId: user.id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          avatarUrl: true,
          visibility: true,
          createdByUserId: true,
          lastMessageAt: true,
          createdAt: true,
          _count: { select: { members: { where: { status: 'active' } } } },
        },
      });

      await tx.studentChatGroupMember.create({
        data: {
          groupId: created.id,
          userId: user.id,
          schoolId: user.schoolId,
          role: 'owner',
          status: 'active',
          lastReadAt: new Date(),
        },
      });

      return created;
    });

    return this.formatGroupRow(group, {
      memberRole: 'owner',
      isMember: true,
      isOwner: true,
    });
  }

  async joinGroup(userId: string, groupId: string) {
    const user = await this.getActiveUser(userId);
    await this.assertGroupMessagingEnabled(user.schoolId);

    const group = await this.prisma.studentChatGroup.findFirst({
      where: { id: groupId, schoolId: user.schoolId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        visibility: true,
        createdByUserId: true,
        lastMessageAt: true,
        createdAt: true,
        _count: { select: { members: { where: { status: 'active' } } } },
      },
    });
    if (!group) throw new NotFoundException('Group not found.');

    if (group.visibility !== 'public') {
      throw new ForbiddenException('This is a private group. Ask the group admin to add you.');
    }

    const existing = await this.prisma.studentChatGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existing?.status === 'active') {
      return this.formatGroupRow(group, {
        memberRole: existing.role,
        isMember: true,
        isOwner: group.createdByUserId === user.id,
      });
    }

    if (existing?.status === 'banned') {
      throw new ForbiddenException('You cannot join this group.');
    }

    if (existing) {
      await this.prisma.studentChatGroupMember.update({
        where: { id: existing.id },
        data: { status: 'active', joinedAt: new Date(), lastReadAt: new Date() },
      });
    } else {
      await this.prisma.studentChatGroupMember.create({
        data: {
          groupId,
          userId: user.id,
          schoolId: user.schoolId,
          role: 'member',
          status: 'active',
          lastReadAt: new Date(),
        },
      });
    }

    const refreshed = await this.prisma.studentChatGroup.findUniqueOrThrow({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        visibility: true,
        createdByUserId: true,
        lastMessageAt: true,
        createdAt: true,
        _count: { select: { members: { where: { status: 'active' } } } },
      },
    });

    return this.formatGroupRow(refreshed, {
      memberRole: 'member',
      isMember: true,
      isOwner: refreshed.createdByUserId === user.id,
    });
  }

  async leaveGroup(userId: string, groupId: string) {
    await this.getGroupForUser(userId, groupId);
    const membership = await this.getActiveMembership(userId, groupId);

    if (membership.role === 'owner') {
      const ownerCount = await this.prisma.studentChatGroupMember.count({
        where: { groupId, status: 'active', role: 'owner' },
      });
      const memberCount = await this.prisma.studentChatGroupMember.count({
        where: { groupId, status: 'active' },
      });

      if (memberCount > 1 && ownerCount === 1) {
        const next = await this.prisma.studentChatGroupMember.findFirst({
          where: { groupId, status: 'active', userId: { not: userId } },
          orderBy: { joinedAt: 'asc' },
        });
        if (next) {
          await this.prisma.studentChatGroupMember.update({
            where: { id: next.id },
            data: { role: 'owner' },
          });
        }
      }
    }

    await this.prisma.studentChatGroupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { status: 'left' },
    });

    return { ok: true };
  }

  async addMember(userId: string, groupId: string, targetUserId: string) {
    const { user, group } = await this.getGroupForUser(userId, groupId);
    const membership = await this.getActiveMembership(userId, groupId);

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      throw new ForbiddenException('Only group owners and admins can add members.');
    }

    if (targetUserId === user.id) {
      throw new BadRequestException('You are already in this group.');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, schoolId: user.schoolId, status: 'active' },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('Student not found at your school.');
    }

    const existing = await this.prisma.studentChatGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (existing?.status === 'active') {
      throw new BadRequestException('This student is already in the group.');
    }
    if (existing?.status === 'banned') {
      throw new ForbiddenException('This student cannot be added to the group.');
    }

    if (existing) {
      await this.prisma.studentChatGroupMember.update({
        where: { id: existing.id },
        data: { status: 'active', joinedAt: new Date(), lastReadAt: new Date() },
      });
    } else {
      await this.prisma.studentChatGroupMember.create({
        data: {
          groupId,
          userId: targetUserId,
          schoolId: user.schoolId,
          role: 'member',
          status: 'active',
          lastReadAt: new Date(),
        },
      });
    }

    return { ok: true };
  }

  async listMembers(userId: string, groupId: string) {
    await this.getGroupForUser(userId, groupId);
    await this.getActiveMembership(userId, groupId);

    const members = await this.prisma.studentChatGroupMember.findMany({
      where: { groupId, status: 'active' },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      select: {
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicUrl: true,
          },
        },
      },
    });

    return members.map((m) => ({
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }

  async markRead(userId: string, groupId: string) {
    await this.getGroupForUser(userId, groupId);
    await this.getActiveMembership(userId, groupId);

    await this.prisma.studentChatGroupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { lastReadAt: new Date() },
    });

    return { ok: true };
  }

  async listMessages(userId: string, groupId: string) {
    await this.getGroupForUser(userId, groupId);
    await this.getActiveMembership(userId, groupId);

    const messages = await this.prisma.studentChatGroupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: STUDENT_CHAT_MESSAGE_SELECT,
    });

    await this.markRead(userId, groupId);

    return messages;
  }

  async sendMessage(userId: string, groupId: string, dto: SendStudentChatGroupMessageDto) {
    const { user } = await this.getGroupForUser(userId, groupId);
    await this.getActiveMembership(userId, groupId);

    const payload = parseChatMessagePayload(dto);

    if (payload.replyToMessageId) {
      const reply = await this.prisma.studentChatGroupMessage.findFirst({
        where: { id: payload.replyToMessageId, groupId },
        select: { id: true },
      });
      if (!reply) {
        throw new BadRequestException('The message you are replying to was not found.');
      }
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.studentChatGroupMessage.create({
        data: {
          groupId,
          senderUserId: user.id,
          body: payload.body,
          attachmentUrl: payload.attachmentUrl,
          attachmentType: payload.attachmentType,
          attachmentName: payload.attachmentName,
          replyToMessageId: payload.replyToMessageId,
        },
        select: STUDENT_CHAT_MESSAGE_SELECT,
      });

      await tx.studentChatGroup.update({
        where: { id: groupId },
        data: { lastMessageAt: new Date() },
      });

      await tx.studentChatGroupMember.update({
        where: { groupId_userId: { groupId, userId: user.id } },
        data: { lastReadAt: new Date() },
      });

      return created;
    });

    return message;
  }
}
