import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { isStudentChatGroupVisibility } from '../../student-chat-groups/student-chat-message.util';
import { CreateStudentChatGroupDto } from '../../user/student-chat-groups/dto/create-student-chat-group.dto';

const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';

@Injectable()
export class SubCategoryAdminStudentChatGroupsService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new ForbiddenException('Group messaging is not enabled for this school.');
    }
  }

  private formatGroupRow(group: {
    id: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
    visibility: string;
    createdAt: Date;
    lastMessageAt: Date | null;
    _count: { members: number };
  }) {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      visibility: isStudentChatGroupVisibility(group.visibility) ? group.visibility : 'public',
      memberCount: group._count.members,
      lastMessageAt: group.lastMessageAt ?? group.createdAt,
      createdAt: group.createdAt,
    };
  }

  async listForSchool(schoolId: string) {
    await this.assertGroupMessagingEnabled(schoolId);
    const groups = await this.prisma.studentChatGroup.findMany({
      where: { schoolId, isActive: true },
      orderBy: [{ lastMessageAt: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        visibility: true,
        createdAt: true,
        lastMessageAt: true,
        _count: { select: { members: { where: { status: 'active' } } } },
      },
    });
    return groups.map((g) => this.formatGroupRow(g));
  }

  async searchStudents(schoolId: string, q?: string) {
    const query = typeof q === 'string' ? q.trim() : '';
    const users = await this.prisma.user.findMany({
      where: {
        schoolId,
        status: 'active',
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { email: { contains: query } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicUrl: true,
      },
      orderBy: { name: 'asc' },
      take: 30,
    });
    return users;
  }

  async createGroup(
    subCategoryAdminId: string,
    schoolId: string,
    dto: CreateStudentChatGroupDto,
  ) {
    await this.assertGroupMessagingEnabled(schoolId);
    const name = dto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Group name must be at least 2 characters.');
    }
    const visibility =
      dto.visibility && isStudentChatGroupVisibility(dto.visibility) ? dto.visibility : 'public';

    const group = await this.prisma.studentChatGroup.create({
      data: {
        schoolId,
        name,
        description: dto.description?.trim() || null,
        visibility,
        createdBySubCategoryAdminId: subCategoryAdminId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        visibility: true,
        createdAt: true,
        lastMessageAt: true,
        _count: { select: { members: { where: { status: 'active' } } } },
      },
    });

    return this.formatGroupRow(group);
  }

  private async getGroupForSchool(groupId: string, schoolId: string) {
    const group = await this.prisma.studentChatGroup.findFirst({
      where: { id: groupId, schoolId, isActive: true },
    });
    if (!group) {
      throw new NotFoundException('Group not found.');
    }
    return group;
  }

  async listMembers(groupId: string, schoolId: string) {
    await this.getGroupForSchool(groupId, schoolId);
    return this.prisma.studentChatGroupMember.findMany({
      where: { groupId, status: 'active' },
      orderBy: { joinedAt: 'asc' },
      select: {
        role: true,
        joinedAt: true,
        user: {
          select: { id: true, name: true, email: true, profilePicUrl: true },
        },
      },
    });
  }

  async addMember(groupId: string, schoolId: string, userId: string) {
    await this.getGroupForSchool(groupId, schoolId);
    const user = await this.prisma.user.findFirst({
      where: { id: userId, schoolId, status: 'active' },
      select: { id: true },
    });
    if (!user) {
      throw new BadRequestException('Student not found at your school.');
    }

    const existing = await this.prisma.studentChatGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existing?.status === 'active') {
      throw new BadRequestException('Student is already in this group.');
    }
    if (existing?.status === 'banned') {
      throw new BadRequestException('This student is banned from the group.');
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
          userId,
          schoolId,
          role: 'member',
          status: 'active',
          lastReadAt: new Date(),
        },
      });
    }

    return { ok: true };
  }
}
