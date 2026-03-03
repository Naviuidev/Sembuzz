import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../super-admin/schools/email.service';
import { MeetingsService } from '../../meetings/meetings.service';
import { CreateSubCategoryAdminQueryDto } from './dto/create-query.dto';

@Injectable()
export class SubCategoryAdminQueriesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private meetingsService: MeetingsService,
  ) {}

  async create(subCategoryAdminId: string, dto: CreateSubCategoryAdminQueryDto) {
    const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;

    const query = await this.prisma.subCategoryAdminQuery.create({
      data: {
        subCategoryAdminId,
        type: dto.type,
        description: message ?? undefined,
        attachmentUrl: dto.attachmentUrl,
        meetingType: dto.meetingType,
        meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : null,
        timeZone: dto.timeZone,
        timeSlot: dto.timeSlot,
        status: 'pending',
      },
      include: {
        subCategoryAdmin: {
          include: {
            category: { select: { name: true } },
            subCategory: { select: { name: true } },
          },
        },
      },
    });

    let meetingLink: string | null = null;
    if (
      dto.type === 'schedule_meeting' &&
      dto.meetingType &&
      dto.meetingDate &&
      dto.timeSlot &&
      dto.timeZone &&
      (dto.meetingType === 'google_meet' || dto.meetingType === 'zoom')
    ) {
      const dateStr = dto.meetingDate.split('T')[0];
      const categoryId = query.subCategoryAdmin.categoryId;
      const categoryAdmins = await this.prisma.categoryAdmin.findMany({
        where: {
          OR: [
            { categoryId },
            { categories: { some: { categoryId } } },
          ],
          isActive: true,
        },
        select: { email: true },
      });
      const attendeeEmails = categoryAdmins.map((a) => a.email);
      if (attendeeEmails.length === 0) attendeeEmails.push(query.subCategoryAdmin.email);
      const result = await this.meetingsService.scheduleMeeting({
        meetingType: dto.meetingType as 'google_meet' | 'zoom',
        meetingDate: dateStr,
        timeSlot: dto.timeSlot,
        timeZone: dto.timeZone,
        title: `SemBuzz Meeting - ${query.subCategoryAdmin.category.name}`,
        attendeeEmails,
      });
      if (!('error' in result)) {
        meetingLink = result.meetingLink;
        await this.prisma.subCategoryAdminQuery.update({
          where: { id: query.id },
          data: { meetingLink },
        });
      }
    }

    const categoryId = query.subCategoryAdmin.categoryId;
    const categoryAdmins = await this.prisma.categoryAdmin.findMany({
      where: {
        OR: [
          { categoryId },
          { categories: { some: { categoryId } } },
        ],
        isActive: true,
      },
      select: { email: true, name: true },
    });

    for (const admin of categoryAdmins) {
      await this.emailService.sendSubCategoryAdminQueryToCategoryAdmin(
        admin.email,
        query.subCategoryAdmin.name,
        query.subCategoryAdmin.email,
        query.subCategoryAdmin.category.name,
        query.subCategoryAdmin.subCategory.name,
        {
          type: dto.type,
          description: message ?? undefined,
          meetingType: dto.meetingType,
          timeZone: dto.timeZone,
          timeSlot: dto.timeSlot,
          attachmentUrl: dto.attachmentUrl,
          meetingLink: meetingLink ?? undefined,
        },
      );
    }

    return meetingLink ? { ...query, meetingLink } : query;
  }

  async listFromSchoolAdmins(subCategoryAdminId: string) {
    const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({
      where: { id: subCategoryAdminId },
      select: { schoolId: true },
    });
    return this.prisma.schoolAdminToSubCategoryAdminQuery.findMany({
      where: { schoolId: admin.schoolId },
      include: {
        schoolAdmin: {
          include: {
            school: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listFromCategoryAdmins(subCategoryAdminId: string) {
    const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({
      where: { id: subCategoryAdminId },
      select: { categoryId: true },
    });
    return this.prisma.categoryAdminToSubCategoryAdminQuery.findMany({
      where: { categoryId: admin.categoryId },
      include: {
        categoryAdmin: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createToSchoolAdmin(subCategoryAdminId: string, dto: CreateSubCategoryAdminQueryDto) {
    const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({
      where: { id: subCategoryAdminId },
      select: { schoolId: true },
    });
    const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
    return this.prisma.subCategoryAdminToSchoolAdminQuery.create({
      data: {
        subCategoryAdminId,
        schoolId: admin.schoolId,
        type: dto.type,
        meetingType: dto.meetingType,
        meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : null,
        timeZone: dto.timeZone,
        timeSlot: dto.timeSlot,
        description: message ?? undefined,
        attachmentUrl: dto.attachmentUrl,
        status: 'pending',
      },
      include: {
        subCategoryAdmin: { select: { name: true } },
      },
    });
  }

  async createToSuperAdmin(subCategoryAdminId: string, dto: CreateSubCategoryAdminQueryDto) {
    const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
    return this.prisma.subCategoryAdminToSuperAdminQuery.create({
      data: {
        subCategoryAdminId,
        type: dto.type,
        meetingType: dto.meetingType,
        meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : null,
        timeZone: dto.timeZone,
        timeSlot: dto.timeSlot,
        description: message ?? undefined,
        customMessage: message ?? undefined,
        attachmentUrl: dto.attachmentUrl,
        status: 'pending',
      },
      include: {
        subCategoryAdmin: { select: { name: true, email: true } },
      },
    });
  }

  async replyToSchoolAdmin(subCategoryAdminId: string, queryId: string, message: string) {
    const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({ where: { id: subCategoryAdminId }, select: { schoolId: true } });
    const query = await this.prisma.schoolAdminToSubCategoryAdminQuery.findFirst({
      where: { id: queryId, schoolId: admin.schoolId },
      include: {
        schoolAdmin: {
          include: { school: { select: { name: true } } },
        },
      },
    });
    if (!query) throw new NotFoundException('Query not found');
    await this.prisma.schoolAdminToSubCategoryAdminQuery.update({
      where: { id: queryId },
      data: { status: 'responded' },
    });
    await this.emailService.sendQueryReply(
      query.schoolAdmin.email,
      query.schoolAdmin.name,
      query.schoolAdmin.school.name,
      query.type,
      message,
    );
    return { message: 'Reply sent successfully' };
  }

  async replyToCategoryAdmin(subCategoryAdminId: string, queryId: string, message: string) {
    const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({ where: { id: subCategoryAdminId }, select: { categoryId: true } });
    const query = await this.prisma.categoryAdminToSubCategoryAdminQuery.findFirst({
      where: { id: queryId, categoryId: admin.categoryId },
      include: {
        categoryAdmin: {
          include: { school: { select: { name: true } } },
        },
      },
    });
    if (!query) throw new NotFoundException('Query not found');
    await this.prisma.categoryAdminToSubCategoryAdminQuery.update({
      where: { id: queryId },
      data: { status: 'responded' },
    });
    await this.emailService.sendReplyToCategoryAdmin(
      query.categoryAdmin.email,
      query.categoryAdmin.name,
      query.categoryAdmin.school.name,
      query.type,
      message,
    );
    return { message: 'Reply sent successfully' };
  }

  async deleteFromSchoolAdmin(id: string, subCategoryAdminId: string) {
    const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({ where: { id: subCategoryAdminId }, select: { schoolId: true } });
    const q = await this.prisma.schoolAdminToSubCategoryAdminQuery.findFirst({ where: { id, schoolId: admin.schoolId } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.schoolAdminToSubCategoryAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }

  async deleteFromCategoryAdmin(id: string, subCategoryAdminId: string) {
    const admin = await this.prisma.subCategoryAdmin.findUniqueOrThrow({ where: { id: subCategoryAdminId }, select: { categoryId: true } });
    const q = await this.prisma.categoryAdminToSubCategoryAdminQuery.findFirst({ where: { id, categoryId: admin.categoryId } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.categoryAdminToSubCategoryAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }
}
