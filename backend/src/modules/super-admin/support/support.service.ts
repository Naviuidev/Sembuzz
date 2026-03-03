import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EmailService } from '../schools/email.service';
import { SupportRequestDto } from '../dto/support-request.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { MeetingsService } from '../../meetings/meetings.service';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'naveenreddyhosur921@gmail.com';

@Injectable()
export class SupportService {
  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
    private meetingsService: MeetingsService,
  ) {}

  async sendSupportRequest(
    supportRequestDto: SupportRequestDto,
    superAdminId?: string,
    superAdminEmail?: string,
  ) {
    let meetingLink: string | null = null;
    let meetingError: string | null = null;
    if (
      supportRequestDto.type === 'schedule_meeting' &&
      supportRequestDto.meetingType &&
      supportRequestDto.meetingDate &&
      supportRequestDto.timeSlot &&
      supportRequestDto.timeZone &&
      (supportRequestDto.meetingType === 'google_meet' || supportRequestDto.meetingType === 'zoom')
    ) {
      const dateStr = supportRequestDto.meetingDate.split('T')[0];
      const attendeeEmails = superAdminEmail ? [superAdminEmail, SUPPORT_EMAIL] : [SUPPORT_EMAIL];
      const result = await this.meetingsService.scheduleMeeting({
        meetingType: supportRequestDto.meetingType as 'google_meet' | 'zoom',
        meetingDate: dateStr,
        timeSlot: supportRequestDto.timeSlot,
        timeZone: supportRequestDto.timeZone,
        title: 'SemBuzz Support Meeting',
        attendeeEmails,
      });
      if (!('error' in result)) {
        meetingLink = result.meetingLink;
      } else {
        meetingError = result.error;
        console.warn('[SupportService] Meeting could not be created:', result.error);
      }
    }

    if (superAdminId) {
      await this.prisma.superAdminQuery.create({
        data: {
          superAdminId,
          type: supportRequestDto.type,
          meetingType: supportRequestDto.meetingType,
          meetingDate: supportRequestDto.meetingDate ? new Date(supportRequestDto.meetingDate) : null,
          timeZone: supportRequestDto.timeZone,
          timeSlot: supportRequestDto.timeSlot,
          meetingLink: meetingLink ?? undefined,
          description: supportRequestDto.description,
          customMessage: supportRequestDto.customMessage,
          status: 'pending',
        },
      });
    }

    await this.emailService.sendDeveloperSupportRequest(
      {
        type: supportRequestDto.type,
        description: supportRequestDto.description,
        meetingType: supportRequestDto.meetingType,
        timeZone: supportRequestDto.timeZone,
        timeSlot: supportRequestDto.timeSlot,
        customMessage: supportRequestDto.customMessage,
        meetingLink: meetingLink ?? undefined,
        meetingError: meetingError ?? undefined,
      },
      superAdminEmail,
    );

    return { message: 'Support request sent successfully', meetingLink: meetingLink ?? undefined };
  }

  async findAll(superAdminId?: string) {
    const where = superAdminId ? { superAdminId } : {};
    return this.prisma.superAdminQuery.findMany({
      where,
      include: {
        superAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.superAdminQuery.update({
      where: { id },
      data: { status },
    });
  }

  async sendReply(id: string, message: string) {
    const query = await this.prisma.superAdminQuery.findUnique({
      where: { id },
      include: {
        superAdmin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!query) {
      throw new Error('Query not found');
    }

    // Update status to responded
    await this.prisma.superAdminQuery.update({
      where: { id },
      data: { status: 'responded' },
    });

    // Send email reply to developer
    await this.emailService.sendDeveloperQueryReply(
      'naveenreddyhosur921@gmail.com',
      query.superAdmin.name,
      query.type,
      message,
    );

    return { message: 'Reply sent successfully' };
  }

  async findFromSchoolAdmins() {
    return this.prisma.query.findMany({
      include: {
        schoolAdmin: {
          include: {
            school: { select: { id: true, name: true, refNum: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFromCategoryAdmins() {
    return this.prisma.categoryAdminToSuperAdminQuery.findMany({
      include: {
        categoryAdmin: {
          include: {
            category: { select: { name: true } },
            school: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFromSubcategoryAdmins() {
    return this.prisma.subCategoryAdminToSuperAdminQuery.findMany({
      include: {
        subCategoryAdmin: {
          include: {
            category: { select: { name: true } },
            subCategory: { select: { name: true } },
            school: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFromSchoolAdmins(id: string) {
    const q = await this.prisma.query.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.query.delete({ where: { id } });
    return { deleted: true };
  }

  async deleteFromCategoryAdmins(id: string) {
    const q = await this.prisma.categoryAdminToSuperAdminQuery.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.categoryAdminToSuperAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }

  async deleteFromSubcategoryAdmins(id: string) {
    const q = await this.prisma.subCategoryAdminToSuperAdminQuery.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.subCategoryAdminToSuperAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }

  async deleteSuperAdminQuery(id: string) {
    const q = await this.prisma.superAdminQuery.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.superAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }

  async replyToSchoolAdminQuery(id: string, message: string) {
    const query = await this.prisma.query.findUnique({
      where: { id },
      include: {
        schoolAdmin: {
          include: {
            school: { select: { name: true } },
          },
        },
      },
    });
    if (!query) throw new NotFoundException('Query not found');
    await this.prisma.query.update({
      where: { id },
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

  async replyToCategoryAdminQuery(id: string, message: string) {
    const query = await this.prisma.categoryAdminToSuperAdminQuery.findUnique({
      where: { id },
      include: {
        categoryAdmin: {
          include: {
            category: { select: { name: true } },
            school: { select: { name: true } },
          },
        },
      },
    });
    if (!query) throw new NotFoundException('Query not found');
    await this.prisma.categoryAdminToSuperAdminQuery.update({
      where: { id },
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

  async replyToSubcategoryAdminQuery(id: string, message: string) {
    const query = await this.prisma.subCategoryAdminToSuperAdminQuery.findUnique({
      where: { id },
      include: {
        subCategoryAdmin: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });
    if (!query) throw new NotFoundException('Query not found');
    await this.prisma.subCategoryAdminToSuperAdminQuery.update({
      where: { id },
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
}
