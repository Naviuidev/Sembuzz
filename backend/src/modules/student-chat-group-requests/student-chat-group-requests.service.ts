import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { isStudentChatGroupVisibility } from '../student-chat-groups/student-chat-message.util';
import { CreateStudentChatGroupRequestDto } from './dto/create-student-chat-group-request.dto';
import { DeclineStudentChatGroupRequestDto } from './dto/decline-student-chat-group-request.dto';
import {
  STUDENT_CHAT_GROUP_REQUEST_SELECT,
  type StudentChatGroupRequestStatus,
} from './student-chat-group-requests.util';

const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';

@Injectable()
export class StudentChatGroupRequestsService {
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
    return this.prisma.studentChatGroupRequest.findMany({
      where: { subCategoryAdminId },
      orderBy: { createdAt: 'desc' },
      select: STUDENT_CHAT_GROUP_REQUEST_SELECT,
    });
  }

  async createForSubCategoryAdmin(
    subCategoryAdminId: string,
    dto: CreateStudentChatGroupRequestDto,
  ) {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: subCategoryAdminId },
      select: { id: true, schoolId: true, isActive: true },
    });
    if (!admin || !admin.isActive) {
      throw new ForbiddenException('Account is not active.');
    }
    await this.assertGroupMessagingEnabled(admin.schoolId);

    const name = dto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Group name must be at least 2 characters.');
    }
    const visibility =
      dto.visibility && isStudentChatGroupVisibility(dto.visibility) ? dto.visibility : 'public';

    const existingGroup = await this.prisma.studentChatGroup.findFirst({
      where: { schoolId: admin.schoolId, name, isActive: true },
      select: { id: true },
    });
    if (existingGroup) {
      throw new BadRequestException('A student group with this name already exists.');
    }

    const pending = await this.prisma.studentChatGroupRequest.findFirst({
      where: { schoolId: admin.schoolId, name, status: 'pending' },
      select: { id: true },
    });
    if (pending) {
      throw new BadRequestException('A request for this group name is already pending approval.');
    }

    return this.prisma.studentChatGroupRequest.create({
      data: {
        schoolId: admin.schoolId,
        subCategoryAdminId: admin.id,
        name,
        description: dto.description?.trim() || null,
        visibility,
        status: 'pending',
      },
      select: STUDENT_CHAT_GROUP_REQUEST_SELECT,
    });
  }

  async listForSchoolReview(schoolId: string, status?: StudentChatGroupRequestStatus) {
    await this.assertGroupMessagingEnabled(schoolId);
    return this.prisma.studentChatGroupRequest.findMany({
      where: {
        schoolId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: STUDENT_CHAT_GROUP_REQUEST_SELECT,
    });
  }

  private async getPendingRequestForSchool(requestId: string, schoolId: string) {
    const row = await this.prisma.studentChatGroupRequest.findFirst({
      where: { id: requestId, schoolId },
      select: {
        id: true,
        schoolId: true,
        subCategoryAdminId: true,
        name: true,
        description: true,
        visibility: true,
        status: true,
      },
    });
    if (!row) throw new NotFoundException('Student group request not found.');
    if (row.status !== 'pending') {
      throw new BadRequestException('This request has already been reviewed.');
    }
    return row;
  }

  private async provisionStudentChatGroup(
    schoolId: string,
    subCategoryAdminId: string,
    name: string,
    description: string | null,
    visibility: string,
  ) {
    const existingGroup = await this.prisma.studentChatGroup.findFirst({
      where: { schoolId, name, isActive: true },
      select: { id: true },
    });
    if (existingGroup) {
      throw new BadRequestException('A student group with this name already exists.');
    }

    const normalizedVisibility = isStudentChatGroupVisibility(visibility) ? visibility : 'public';

    return this.prisma.studentChatGroup.create({
      data: {
        schoolId,
        name,
        description,
        visibility: normalizedVisibility,
        createdBySubCategoryAdminId: subCategoryAdminId,
      },
      select: { id: true, name: true, visibility: true },
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
    const group = await this.provisionStudentChatGroup(
      schoolId,
      row.subCategoryAdminId,
      row.name,
      row.description,
      row.visibility,
    );
    return this.prisma.studentChatGroupRequest.update({
      where: { id: row.id },
      data: {
        status: 'approved',
        reviewedByRole: reviewerRole,
        reviewedByAdminId: reviewerAdminId,
        reviewedAt: new Date(),
        studentChatGroupId: group.id,
      },
      select: STUDENT_CHAT_GROUP_REQUEST_SELECT,
    });
  }

  async decline(
    requestId: string,
    schoolId: string,
    reviewerRole: 'category_admin' | 'school_admin',
    reviewerAdminId: string,
    dto: DeclineStudentChatGroupRequestDto,
  ) {
    await this.assertGroupMessagingEnabled(schoolId);
    const row = await this.getPendingRequestForSchool(requestId, schoolId);
    return this.prisma.studentChatGroupRequest.update({
      where: { id: row.id },
      data: {
        status: 'declined',
        reviewedByRole: reviewerRole,
        reviewedByAdminId: reviewerAdminId,
        reviewedAt: new Date(),
        declineReason: dto.reason?.trim() || null,
      },
      select: STUDENT_CHAT_GROUP_REQUEST_SELECT,
    });
  }
}
