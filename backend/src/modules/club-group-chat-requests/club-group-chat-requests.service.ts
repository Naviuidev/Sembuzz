import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CLUB_GROUP_CHAT_REQUEST_SELECT,
  clubKeyFromParts,
  groupSchoolSocialAccountsIntoClubs,
  type ClubGroupChatRequestStatus,
} from './club-group-chat-requests.util';
import { CreateClubGroupChatRequestDto } from './dto/create-club-group-chat-request.dto';
import { DeclineClubGroupChatRequestDto } from './dto/decline-club-group-chat-request.dto';

const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';

@Injectable()
export class ClubGroupChatRequestsService {
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

  async listClubsForSchool(schoolId: string) {
    await this.assertGroupMessagingEnabled(schoolId);
    const accounts = await this.prisma.schoolSocialAccount.findMany({
      where: { schoolId },
      select: { id: true, pageName: true, icon: true },
      orderBy: { pageName: 'asc' },
    });
    const clubs = groupSchoolSocialAccountsIntoClubs(accounts);
    const [enabledChats, pendingRequests] = await Promise.all([
      this.prisma.clubGroupChat.findMany({
        where: { schoolId, isEnabled: true },
        select: { clubKey: true },
      }),
      this.prisma.clubGroupChatRequest.findMany({
        where: { schoolId, status: 'pending' },
        select: { clubKey: true },
      }),
    ]);
    const enabledKeys = new Set(enabledChats.map((c) => c.clubKey));
    const pendingKeys = new Set(pendingRequests.map((r) => r.clubKey));
    return clubs.map((club) => ({
      ...club,
      hasGroupChat: enabledKeys.has(club.key),
      hasPendingRequest: pendingKeys.has(club.key),
    }));
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
    return this.prisma.clubGroupChatRequest.findMany({
      where: { subCategoryAdminId },
      orderBy: { createdAt: 'desc' },
      select: CLUB_GROUP_CHAT_REQUEST_SELECT,
    });
  }

  async createForSubCategoryAdmin(subCategoryAdminId: string, dto: CreateClubGroupChatRequestDto) {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      select: { id: true, schoolId: true, isActive: true },
    });
    if (!admin || !admin.isActive) {
      throw new ForbiddenException('Account is not active.');
    }
    await this.assertGroupMessagingEnabled(admin.schoolId);

    const expectedKey = clubKeyFromParts(dto.pageName, dto.icon);
    if (dto.clubKey !== expectedKey) {
      throw new BadRequestException('Club selection is invalid. Please choose a club again.');
    }

    const clubExists = await this.prisma.schoolSocialAccount.findFirst({
      where: {
        schoolId: admin.schoolId,
        pageName: dto.pageName,
        icon: dto.icon,
      },
      select: { id: true },
    });
    if (!clubExists) {
      throw new BadRequestException('Club not found. Ask your school admin to create the club under Social Share.');
    }

    const existingChat = await this.prisma.clubGroupChat.findUnique({
      where: {
        schoolId_clubKey: { schoolId: admin.schoolId, clubKey: dto.clubKey },
      },
      select: { id: true, isEnabled: true },
    });
    if (existingChat?.isEnabled) {
      throw new BadRequestException('Group chat already exists for this club.');
    }

    const pending = await this.prisma.clubGroupChatRequest.findFirst({
      where: {
        schoolId: admin.schoolId,
        clubKey: dto.clubKey,
        status: 'pending',
      },
      select: { id: true },
    });
    if (pending) {
      throw new BadRequestException('A request for this club is already pending approval.');
    }

    return this.prisma.clubGroupChatRequest.create({
      data: {
        schoolId: admin.schoolId,
        subCategoryAdminId: admin.id,
        clubKey: dto.clubKey,
        pageName: dto.pageName,
        icon: dto.icon,
        note: dto.note?.trim() || null,
        status: 'pending',
      },
      select: CLUB_GROUP_CHAT_REQUEST_SELECT,
    });
  }

  async listForSchoolReview(schoolId: string, status?: ClubGroupChatRequestStatus) {
    await this.assertGroupMessagingEnabled(schoolId);
    return this.prisma.clubGroupChatRequest.findMany({
      where: {
        schoolId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: CLUB_GROUP_CHAT_REQUEST_SELECT,
    });
  }

  private async getPendingRequestForSchool(requestId: string, schoolId: string) {
    const row = await this.prisma.clubGroupChatRequest.findFirst({
      where: { id: requestId, schoolId },
      select: {
        id: true,
        schoolId: true,
        clubKey: true,
        pageName: true,
        icon: true,
        status: true,
      },
    });
    if (!row) throw new NotFoundException('Group chat request not found.');
    if (row.status !== 'pending') {
      throw new BadRequestException('This request has already been reviewed.');
    }
    return row;
  }

  private async provisionClubGroupChat(
    schoolId: string,
    clubKey: string,
    pageName: string,
    icon: string,
  ) {
    const clubExists = await this.prisma.schoolSocialAccount.findFirst({
      where: { schoolId, pageName, icon },
      select: { id: true },
    });
    if (!clubExists) {
      throw new BadRequestException('Club no longer exists for this school.');
    }

    return this.prisma.clubGroupChat.upsert({
      where: { schoolId_clubKey: { schoolId, clubKey } },
      create: {
        schoolId,
        clubKey,
        pageName,
        icon,
        isEnabled: true,
      },
      update: {
        pageName,
        icon,
        isEnabled: true,
      },
      select: { id: true, clubKey: true, pageName: true, icon: true },
    });
  }

  async approve(
    requestId: string,
    schoolId: string,
    reviewerRole: 'category_admin' | 'school_admin',
    reviewerAdminId: string,
  ) {
    await this.assertGroupMessagingEnabled(schoolId);
    const row = await this.getPendingRequestForSchool(requestId, schoolId);
    const chat = await this.provisionClubGroupChat(
      schoolId,
      row.clubKey,
      row.pageName,
      row.icon,
    );
    return this.prisma.clubGroupChatRequest.update({
      where: { id: row.id },
      data: {
        status: 'approved',
        reviewedByRole: reviewerRole,
        reviewedByAdminId: reviewerAdminId,
        reviewedAt: new Date(),
        clubGroupChatId: chat.id,
      },
      select: CLUB_GROUP_CHAT_REQUEST_SELECT,
    });
  }

  async decline(
    requestId: string,
    schoolId: string,
    reviewerRole: 'category_admin' | 'school_admin',
    reviewerAdminId: string,
    dto: DeclineClubGroupChatRequestDto,
  ) {
    await this.assertGroupMessagingEnabled(schoolId);
    const row = await this.getPendingRequestForSchool(requestId, schoolId);
    return this.prisma.clubGroupChatRequest.update({
      where: { id: row.id },
      data: {
        status: 'declined',
        reviewedByRole: reviewerRole,
        reviewedByAdminId: reviewerAdminId,
        reviewedAt: new Date(),
        declineReason: dto.reason?.trim() || null,
      },
      select: CLUB_GROUP_CHAT_REQUEST_SELECT,
    });
  }
}
