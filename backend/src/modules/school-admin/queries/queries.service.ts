import { Injectable, Logger, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateQueryDto } from '../dto/create-query.dto';
import { EmailService } from '../../super-admin/schools/email.service';
import { MeetingsService } from '../../meetings/meetings.service';

@Injectable()
export class QueriesService {
  private readonly logger = new Logger(QueriesService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private meetingsService: MeetingsService,
  ) {}

  async create(adminId: string, createQueryDto: CreateQueryDto) {
    const { type, meetingType, date, timeSlot, timeZone, description, customMessage, attachmentUrl } = createQueryDto;
    const messageOrDescription = type === 'custom_message' ? customMessage ?? description : description;

    let query;
    try {
      query = await this.prisma.query.create({
      data: {
        schoolAdminId: adminId,
        type,
        meetingType,
        date: date ? new Date(date) : null,
        timeSlot,
        timeZone,
        description: messageOrDescription ?? undefined,
        attachmentUrl: attachmentUrl ?? undefined,
        status: 'pending',
      },
      include: {
        schoolAdmin: {
          include: {
            school: {
              select: {
                name: true,
                refNum: true,
              },
            },
          },
        },
      },
    });
    } catch (err: unknown) {
      this.logger.error('Failed to create query', err);
      const message = err instanceof Error ? err.message : 'Failed to create query';
      throw new InternalServerErrorException(message);
    }

    let meetingLink: string | null = null;
    if (
      type === 'schedule_meeting' &&
      meetingType &&
      date &&
      timeSlot &&
      timeZone &&
      (meetingType === 'google_meet' || meetingType === 'zoom')
    ) {
      try {
        const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          this.logger.warn(`Invalid date format received: ${date}`);
        } else {
          const superAdmins = await this.prisma.superAdmin.findMany({ select: { email: true } });
          const attendeeEmails = superAdmins.length > 0 ? superAdmins.map((a) => a.email) : [process.env.SUPPORT_EMAIL || 'naveenreddyhosur921@gmail.com'];
          const result = await this.meetingsService.scheduleMeeting({
            meetingType: meetingType as 'google_meet' | 'zoom',
            meetingDate: dateStr,
            timeSlot,
            timeZone,
            title: `SemBuzz Meeting - ${query.schoolAdmin.school.name}`,
            attendeeEmails,
          });
          if (!('error' in result)) {
            meetingLink = result.meetingLink;
            await this.prisma.query.update({ where: { id: query.id }, data: { meetingLink } });
          } else {
            this.logger.warn('Meeting creation failed:', result.error);
          }
        }
      } catch (err: unknown) {
        this.logger.error('Meeting schedule error', err);
      }
    }

    try {
      await this.emailService.sendSchoolAdminQueryToSuperAdmin(
        query.schoolAdmin.name,
        query.schoolAdmin.email,
        query.schoolAdmin.school.name,
        {
          type,
          description: messageOrDescription ?? undefined,
          customMessage: type === 'custom_message' ? messageOrDescription ?? undefined : undefined,
          meetingType,
          timeZone: timeZone ?? undefined,
          timeSlot: timeSlot ?? undefined,
          attachmentUrl: attachmentUrl ?? undefined,
          meetingLink: meetingLink ?? undefined,
        },
      );
    } catch (err: unknown) {
      this.logger.error('Failed to send email', err);
      const message = err instanceof Error ? err.message : 'Failed to send notification email';
      throw new InternalServerErrorException(message);
    }

    return meetingLink ? { ...query, meetingLink } : query;
  }

  async findAll(adminId?: string) {
    const where = adminId ? { schoolAdminId: adminId } : {};

    return this.prisma.query.findMany({
      where,
      include: {
        schoolAdmin: {
          include: {
            school: {
              select: {
                name: true,
                refNum: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.query.findUnique({
      where: { id },
      include: {
        schoolAdmin: {
          include: {
            school: {
              select: {
                name: true,
                refNum: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.query.update({
      where: { id },
      data: { status },
    });
  }

  async sendReply(id: string, message: string) {
    const query = await this.prisma.query.findUnique({
      where: { id },
      include: {
        schoolAdmin: {
          include: {
            school: {
              select: {
                name: true,
                refNum: true,
              },
            },
          },
        },
      },
    });

    if (!query) {
      throw new Error('Query not found');
    }

    // Update status to responded
    await this.prisma.query.update({
      where: { id },
      data: { status: 'responded' },
    });

    // Send email reply
    await this.emailService.sendQueryReply(
      query.schoolAdmin.email,
      query.schoolAdmin.name,
      query.schoolAdmin.school.name,
      query.type,
      message,
    );

    return { message: 'Reply sent successfully' };
  }

  async listFromCategoryAdmins(schoolAdminId: string) {
    const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({
      where: { id: schoolAdminId },
      select: { schoolId: true },
    });
    return this.prisma.categoryAdminQuery.findMany({
      where: { schoolId: admin.schoolId },
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

  async replyToCategoryAdmin(queryId: string, message: string) {
    const query = await this.prisma.categoryAdminQuery.findUniqueOrThrow({
      where: { id: queryId },
      include: {
        categoryAdmin: { select: { name: true, email: true } },
        school: { select: { name: true } },
      },
    });
    await this.prisma.categoryAdminQuery.update({
      where: { id: queryId },
      data: { status: 'responded' },
    });
    await this.emailService.sendReplyToCategoryAdmin(
      query.categoryAdmin.email,
      query.categoryAdmin.name,
      query.school.name,
      query.type,
      message,
    );
    return { message: 'Reply sent successfully' };
  }

  async createToCategoryAdmin(adminId: string, dto: CreateQueryDto) {
    const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({
      where: { id: adminId },
      select: { schoolId: true },
    });
    const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
    return this.prisma.schoolAdminToCategoryAdminQuery.create({
      data: {
        schoolAdminId: adminId,
        schoolId: admin.schoolId,
        type: dto.type,
        meetingType: dto.meetingType,
        date: dto.date ? new Date(dto.date) : null,
        timeSlot: dto.timeSlot,
        timeZone: dto.timeZone,
        description: message ?? undefined,
        attachmentUrl: dto.attachmentUrl,
        status: 'pending',
      },
      include: {
        schoolAdmin: { select: { name: true } },
        school: { select: { name: true } },
      },
    });
  }

  async createToSubCategoryAdmin(adminId: string, dto: CreateQueryDto) {
    const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({
      where: { id: adminId },
      select: { schoolId: true },
    });
    const message = dto.type === 'custom_message' ? (dto.customMessage ?? dto.description) : dto.description;
    return this.prisma.schoolAdminToSubCategoryAdminQuery.create({
      data: {
        schoolAdminId: adminId,
        schoolId: admin.schoolId,
        type: dto.type,
        meetingType: dto.meetingType,
        date: dto.date ? new Date(dto.date) : null,
        timeSlot: dto.timeSlot,
        timeZone: dto.timeZone,
        description: message ?? undefined,
        attachmentUrl: dto.attachmentUrl,
        status: 'pending',
      },
      include: {
        schoolAdmin: { select: { name: true } },
        school: { select: { name: true } },
      },
    });
  }

  async listFromSubCategoryAdmins(schoolAdminId: string) {
    const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({
      where: { id: schoolAdminId },
      select: { schoolId: true },
    });
    return this.prisma.subCategoryAdminToSchoolAdminQuery.findMany({
      where: { schoolId: admin.schoolId },
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

  async deleteRaisedToSuperAdmin(id: string, schoolAdminId: string) {
    const q = await this.prisma.query.findFirst({ where: { id, schoolAdminId } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.query.delete({ where: { id } });
    return { deleted: true };
  }

  async deleteFromCategoryAdmin(id: string, schoolAdminId: string) {
    const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({ where: { id: schoolAdminId }, select: { schoolId: true } });
    const q = await this.prisma.categoryAdminQuery.findFirst({ where: { id, schoolId: admin.schoolId } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.categoryAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }

  async replyToSubcategoryAdmin(schoolAdminId: string, queryId: string, message: string) {
    const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({ where: { id: schoolAdminId }, select: { schoolId: true } });
    const query = await this.prisma.subCategoryAdminToSchoolAdminQuery.findFirst({
      where: { id: queryId, schoolId: admin.schoolId },
      include: {
        subCategoryAdmin: {
          include: { category: { select: { name: true } } },
        },
      },
    });
    if (!query) throw new NotFoundException('Query not found');
    await this.prisma.subCategoryAdminToSchoolAdminQuery.update({
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

  async deleteFromSubcategoryAdmin(id: string, schoolAdminId: string) {
    const admin = await this.prisma.schoolAdmin.findUniqueOrThrow({ where: { id: schoolAdminId }, select: { schoolId: true } });
    const q = await this.prisma.subCategoryAdminToSchoolAdminQuery.findFirst({ where: { id, schoolId: admin.schoolId } });
    if (!q) throw new NotFoundException('Query not found');
    if (q.status !== 'responded') throw new BadRequestException('Respond to the query in order to delete it.');
    await this.prisma.subCategoryAdminToSchoolAdminQuery.delete({ where: { id } });
    return { deleted: true };
  }
}
