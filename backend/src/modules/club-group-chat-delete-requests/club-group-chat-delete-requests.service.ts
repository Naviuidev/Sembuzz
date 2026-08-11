import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClubGroupChatDeleteRequestDto } from './dto/create-club-group-chat-delete-request.dto';
import { DeclineMessagingDeleteRequestDto } from './dto/decline-messaging-delete-request.dto';
import {
  CLUB_GROUP_CHAT_DELETE_REQUEST_SELECT,
  type MessagingDeleteRequestStatus,
} from './club-group-chat-delete-requests.util';

const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';

@Injectable()
export class ClubGroupChatDeleteRequestsService {
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

  async listForSubCategoryAdmin(subCategoryAdminId: string) {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      select: { id: true, schoolId: true, isActive: true },
    });
    if (!admin || !admin.isActive) {
      throw new ForbiddenException('Account is not active.');
    }
    await this.assertGroupMessagingEnabled(admin.schoolId);
    return this.prisma.clubGroupChatDeleteRequest.findMany({
      where: { subCategoryAdminId },
      orderBy: { createdAt: 'desc' },
      select: CLUB_GROUP_CHAT_DELETE_REQUEST_SELECT,
    });
  }

  async createForSubCategoryAdmin(
    subCategoryAdminId: string,
    dto: CreateClubGroupChatDeleteRequestDto,
  ) {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      select: { id: true, schoolId: true, isActive: true },
    });
    if (!admin || !admin.isActive) {
      throw new ForbiddenException('Account is not active.');
    }
    await this.assertGroupMessagingEnabled(admin.schoolId);

    const chat = await this.prisma.clubGroupChat.findFirst({
      where: { id: dto.clubGroupChatId, schoolId: admin.schoolId, isEnabled: true },
      select: { id: true },
    });
    if (!chat) {
      throw new BadRequestException('Club group chat not found or already removed.');
    }

    const pending = await this.prisma.clubGroupChatDeleteRequest.findFirst({
      where: { clubGroupChatId: dto.clubGroupChatId, status: 'pending' },
      select: { id: true },
    });
    if (pending) {
      throw new BadRequestException('A delete request for this group chat is already pending.');
    }

    return this.prisma.clubGroupChatDeleteRequest.create({
      data: {
        schoolId: admin.schoolId,
        subCategoryAdminId: admin.id,
        clubGroupChatId: dto.clubGroupChatId,
        note: dto.note?.trim() || null,
        status: 'pending',
      },
      select: CLUB_GROUP_CHAT_DELETE_REQUEST_SELECT,
    });
  }

  async listForSchoolReview(schoolId: string, status?: MessagingDeleteRequestStatus) {
    await this.assertGroupMessagingEnabled(schoolId);
    return this.prisma.clubGroupChatDeleteRequest.findMany({
      where: { schoolId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      select: CLUB_GROUP_CHAT_DELETE_REQUEST_SELECT,
    });
  }

  private async getPendingForSchool(requestId: string, schoolId: string) {
    const row = await this.prisma.clubGroupChatDeleteRequest.findFirst({
      where: { id: requestId, schoolId },
      select: { id: true, clubGroupChatId: true, status: true },
    });
    if (!row) throw new NotFoundException('Delete request not found.');
    if (row.status !== 'pending') {
      throw new BadRequestException('This request has already been reviewed.');
    }
    return row;
  }

  async approve(
    requestId: string,
    schoolId: string,
    reviewerRole: 'category_admin' | 'school_admin',
    reviewerAdminId: string,
  ) {
    await this.assertGroupMessagingEnabled(schoolId);
    const row = await this.getPendingForSchool(requestId, schoolId);

    const chat = await this.prisma.clubGroupChat.findFirst({
      where: { id: row.clubGroupChatId, schoolId, isEnabled: true },
      select: { id: true },
    });
    if (!chat) {
      throw new BadRequestException('Club group chat no longer exists or is already disabled.');
    }

    await this.prisma.clubGroupChat.update({
      where: { id: row.clubGroupChatId },
      data: { isEnabled: false },
    });

    return this.prisma.clubGroupChatDeleteRequest.update({
      where: { id: row.id },
      data: {
        status: 'approved',
        reviewedByRole: reviewerRole,
        reviewedByAdminId: reviewerAdminId,
        reviewedAt: new Date(),
      },
      select: CLUB_GROUP_CHAT_DELETE_REQUEST_SELECT,
    });
  }

  async decline(
    requestId: string,
    schoolId: string,
    reviewerRole: 'category_admin' | 'school_admin',
    reviewerAdminId: string,
    dto: DeclineMessagingDeleteRequestDto,
  ) {
    await this.assertGroupMessagingEnabled(schoolId);
    const row = await this.getPendingForSchool(requestId, schoolId);
    return this.prisma.clubGroupChatDeleteRequest.update({
      where: { id: row.id },
      data: {
        status: 'declined',
        reviewedByRole: reviewerRole,
        reviewedByAdminId: reviewerAdminId,
        reviewedAt: new Date(),
        declineReason: dto.reason?.trim() || null,
      },
      select: CLUB_GROUP_CHAT_DELETE_REQUEST_SELECT,
    });
  }
}
