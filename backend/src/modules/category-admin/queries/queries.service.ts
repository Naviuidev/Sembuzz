import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../super-admin/schools/email.service';
import { MeetingsService } from '../../meetings/meetings.service';
import { CreateCategoryAdminQueryDto } from './dto/create-query.dto';

@Injectable()
export class CategoryAdminQueriesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private meetingsService: MeetingsService,
  ) {}

  async create(categoryAdminId: string, dto: CreateCategoryAdminQueryDto) {
    const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
      where: { id: categoryAdminId },
      include: {
        school: { select: { id: true, name: true } },
        category: { select: { name: true } },
      },
    });

    const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;

    const query = await this.prisma.categoryAdminQuery.create({
      data: {
        categoryAdminId,
        schoolId: admin.schoolId,
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
        categoryAdmin: {
          select: { name: true, email: true },
        },
        school: { select: { name: true } },
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
      const schoolAdmins = await this.prisma.schoolAdmin.findMany({
        where: { schoolId: admin.schoolId, isActive: true },
        select: { email: true },
      });
      const attendeeEmails = schoolAdmins.map((a) => a.email);
      if (attendeeEmails.length === 0) attendeeEmails.push(query.categoryAdmin.email);
      const result = await this.meetingsService.scheduleMeeting({
        meetingType: dto.meetingType as 'google_meet' | 'zoom',
        meetingDate: dateStr,
        timeSlot: dto.timeSlot,
        timeZone: dto.timeZone,
        title: `SemBuzz Meeting - ${admin.category.name}`,
        attendeeEmails,
      });
      if (!('error' in result)) {
        meetingLink = result.meetingLink;
        await this.prisma.categoryAdminQuery.update({
          where: { id: query.id },
          data: { meetingLink },
        });
      }
    }

    const schoolAdmins = await this.prisma.schoolAdmin.findMany({
      where: { schoolId: admin.schoolId, isActive: true },
      select: { email: true },
    });

    for (const sa of schoolAdmins) {
      await this.emailService.sendCategoryAdminQueryToSchoolAdmin(
        sa.email,
        query.categoryAdmin.name,
        query.categoryAdmin.email,
        query.school.name,
        admin.category.name,
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

  async listFromSubcategoryAdmins(categoryAdminId: string) {
    const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
      where: { id: categoryAdminId },
      select: { categoryId: true, categories: { select: { categoryId: true } } },
    });
    const categoryIds = [admin.categoryId, ...admin.categories.map((c) => c.categoryId)];

    return this.prisma.subCategoryAdminQuery.findMany({
      where: {
        subCategoryAdmin: {
          categoryId: { in: categoryIds },
        },
      },
      include: {
        subCategoryAdmin: {
          include: {
            category: { select: { name: true } },
            subCategory: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async replyToSubcategoryAdmin(queryId: string, message: string) {
    const query = await this.prisma.subCategoryAdminQuery.findUniqueOrThrow({
      where: { id: queryId },
      include: {
        subCategoryAdmin: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });

    await this.prisma.subCategoryAdminQuery.update({
      where: { id: queryId },
      data: { status: 'responded' },
    });

    await this.emailService.sendReplyToSubCategoryAdmin(
      query.subCategoryAdmin.email,
      query.subCategoryAdmin.name,
      query.subCategoryAdmin.category.name,
      query.type,
      message,
    );

    return { message: 'Reply sent successfully' };
  }

  async listFromSchoolAdmins(categoryAdminId: string) {
    const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
      where: { id: categoryAdminId },
      select: { schoolId: true },
    });
    return this.prisma.schoolAdminToCategoryAdminQuery.findMany({
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

  async replyToSchoolAdmin(categoryAdminId: string, queryId: string, message: string) {
    const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
      where: { id: categoryAdminId },
      select: { schoolId: true },
    });
    const query = await this.prisma.schoolAdminToCategoryAdminQuery.findFirst({
      where: { id: queryId, schoolId: admin.schoolId },
      include: {
        schoolAdmin: {
          include: { school: { select: { name: true } } },
        },
      },
    });
    if (!query) throw new NotFoundException('Query not found');
    await this.prisma.schoolAdminToCategoryAdminQuery.update({
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

  async createToSubCategoryAdmin(categoryAdminId: string, dto: CreateCategoryAdminQueryDto) {
    const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
      where: { id: categoryAdminId },
      select: { categoryId: true },
    });
    const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
    return this.prisma.categoryAdminToSubCategoryAdminQuery.create({
      data: {
        categoryAdminId,
        categoryId: admin.categoryId,
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
        categoryAdmin: { select: { name: true } },
        category: { select: { name: true } },
      },
    });
  }

  async createToSuperAdmin(categoryAdminId: string, dto: CreateCategoryAdminQueryDto) {
    const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
    return this.prisma.categoryAdminToSuperAdminQuery.create({
      data: {
        categoryAdminId,
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
        categoryAdmin: { select: { name: true, email: true } },
      },
    });
  }

  async listRaisedToSuperAdmin(categoryAdminId: string) {
    return this.prisma.categoryAdminToSuperAdminQuery.findMany({
      where: { categoryAdminId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendFollowUpToSuperAdmin(categoryAdminId: string, queryId: string, message: string) {
    const query = await this.prisma.categoryAdminToSuperAdminQuery.findFirst({
      where: { id: queryId, categoryAdminId },
      include: {
        categoryAdmin: { select: { name: true, email: true } },
      },
    });
    if (!query) throw new NotFoundException('Query not found');
    const superAdmins = await this.prisma.superAdmin.findMany({
      select: { email: true },
    });
    const emails = superAdmins.map((a) => a.email);
    if (emails.length === 0 && process.env.SUPPORT_EMAIL) emails.push(process.env.SUPPORT_EMAIL);
    await this.emailService.sendCategoryAdminFollowUpToSuperAdmin(
      emails,
      query.categoryAdmin.name,
      query.categoryAdmin.email,
      query.type,
      message,
    );
    return { message: 'Follow-up sent successfully' };
  }

  async deleteFromSchoolAdmin(id: string, categoryAdminId: string) {
    const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({ where: { id: categoryAdminId }, select: { schoolId: true } });
    const q = await this.prisma.schoolAdminToCategoryAdminQuery.findFirst({ where: { id, schoolId: admin.schoolId } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.schoolAdminToCategoryAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }

  async deleteFromSubcategoryAdmin(id: string, categoryAdminId: string) {
    const admin = await this.prisma.categoryAdmin.findUniqueOrThrow({
      where: { id: categoryAdminId },
      select: { categoryId: true, categories: { select: { categoryId: true } } },
    });
    const categoryIds = [admin.categoryId, ...admin.categories.map((c) => c.categoryId)];
    const q = await this.prisma.subCategoryAdminQuery.findFirst({
      where: { id, subCategoryAdmin: { categoryId: { in: categoryIds } } },
    });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.subCategoryAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }

  async deleteRaisedToSuperAdmin(id: string, categoryAdminId: string) {
    const q = await this.prisma.categoryAdminToSuperAdminQuery.findFirst({ where: { id, categoryAdminId } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.categoryAdminToSuperAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }
}
