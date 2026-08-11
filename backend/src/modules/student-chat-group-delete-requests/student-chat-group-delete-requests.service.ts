import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentChatGroupDeleteRequestDto } from './dto/create-student-chat-group-delete-request.dto';
import { DeclineMessagingDeleteRequestDto } from './dto/decline-messaging-delete-request.dto';
import {
  STUDENT_CHAT_GROUP_DELETE_REQUEST_SELECT,
  type MessagingDeleteRequestStatus,
} from './student-chat-group-delete-requests.util';

const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';

@Injectable()
export class StudentChatGroupDeleteRequestsService {
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
    return this.prisma.studentChatGroupDeleteRequest.findMany({
      where: { subCategoryAdminId },
      orderBy: { createdAt: 'desc' },
      select: STUDENT_CHAT_GROUP_DELETE_REQUEST_SELECT,
    });
  }

  async createForSubCategoryAdmin(
    subCategoryAdminId: string,
    dto: CreateStudentChatGroupDeleteRequestDto,
  ) {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      select: { id: true, schoolId: true, isActive: true },
    });
    if (!admin || !admin.isActive) {
      throw new ForbiddenException('Account is not active.');
    }
    await this.assertGroupMessagingEnabled(admin.schoolId);

    const group = await this.prisma.studentChatGroup.findFirst({
      where: { id: dto.studentChatGroupId, schoolId: admin.schoolId, isActive: true },
      select: { id: true },
    });
    if (!group) {
      throw new BadRequestException('Student group not found or already removed.');
    }

    const pending = await this.prisma.studentChatGroupDeleteRequest.findFirst({
      where: { studentChatGroupId: dto.studentChatGroupId, status: 'pending' },
      select: { id: true },
    });
    if (pending) {
      throw new BadRequestException('A delete request for this student group is already pending.');
    }

    return this.prisma.studentChatGroupDeleteRequest.create({
      data: {
        schoolId: admin.schoolId,
        subCategoryAdminId: admin.id,
        studentChatGroupId: dto.studentChatGroupId,
        note: dto.note?.trim() || null,
        status: 'pending',
      },
      select: STUDENT_CHAT_GROUP_DELETE_REQUEST_SELECT,
    });
  }

  async listForSchoolReview(schoolId: string, status?: MessagingDeleteRequestStatus) {
    await this.assertGroupMessagingEnabled(schoolId);
    return this.prisma.studentChatGroupDeleteRequest.findMany({
      where: { schoolId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      select: STUDENT_CHAT_GROUP_DELETE_REQUEST_SELECT,
    });
  }

  private async getPendingForSchool(requestId: string, schoolId: string) {
    const row = await this.prisma.studentChatGroupDeleteRequest.findFirst({
      where: { id: requestId, schoolId },
      select: { id: true, studentChatGroupId: true, status: true },
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

    const group = await this.prisma.studentChatGroup.findFirst({
      where: { id: row.studentChatGroupId, schoolId, isActive: true },
      select: { id: true },
    });
    if (!group) {
      throw new BadRequestException('Student group no longer exists or is already removed.');
    }

    await this.prisma.studentChatGroup.update({
      where: { id: row.studentChatGroupId },
      data: { isActive: false },
    });

    return this.prisma.studentChatGroupDeleteRequest.update({
      where: { id: row.id },
      data: {
        status: 'approved',
        reviewedByRole: reviewerRole,
        reviewedByAdminId: reviewerAdminId,
        reviewedAt: new Date(),
      },
      select: STUDENT_CHAT_GROUP_DELETE_REQUEST_SELECT,
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
    return this.prisma.studentChatGroupDeleteRequest.update({
      where: { id: row.id },
      data: {
        status: 'declined',
        reviewedByRole: reviewerRole,
        reviewedByAdminId: reviewerAdminId,
        reviewedAt: new Date(),
        declineReason: dto.reason?.trim() || null,
      },
      select: STUDENT_CHAT_GROUP_DELETE_REQUEST_SELECT,
    });
  }
}
