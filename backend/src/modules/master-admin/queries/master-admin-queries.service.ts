import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueriesService } from '../../school-admin/queries/queries.service';
import { CreateQueryDto } from '../../school-admin/dto/create-query.dto';
import { EmailService } from '../../super-admin/schools/email.service';
import { MeetingsService } from '../../meetings/meetings.service';
import { MasterAdminRaiseQueryDto } from './dto/master-admin-raise-query.dto';
import { MasterAdminDeveloperRequestDto } from './dto/master-admin-developer-request.dto';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'naveenreddyhosur921@gmail.com';

const MASTER_ADMIN_PREFIX = '[Master Admin]';

@Injectable()
export class MasterAdminQueriesService {
  constructor(
    private prisma: PrismaService,
    private schoolQueries: QueriesService,
    private emailService: EmailService,
    private meetingsService: MeetingsService,
  ) {}

  private async assertSchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  private async resolveSchoolAdminPoc(schoolId: string) {
    const admin = await this.prisma.schoolAdmin.findFirst({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!admin) {
      throw new BadRequestException('This school has no active school admin to attach the request.');
    }
    return admin;
  }

  private prefixMessage(dto: CreateQueryDto): CreateQueryDto {
    const body = dto.type === 'custom_message' ? dto.customMessage ?? dto.description : dto.description;
    const prefixed = body ? `${MASTER_ADMIN_PREFIX}\n\n${body}` : MASTER_ADMIN_PREFIX;
    if (dto.type === 'custom_message') {
      return { ...dto, customMessage: prefixed, description: prefixed };
    }
    return { ...dto, description: prefixed };
  }

  async listInbox(schoolId: string) {
    await this.assertSchool(schoolId);
    const [fromCategoryAdmins, fromSubCategoryAdmins, toSuperAdmin] = await Promise.all([
      this.prisma.categoryAdminQuery.findMany({
        where: { schoolId },
        include: {
          categoryAdmin: {
            include: { category: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subCategoryAdminToSchoolAdminQuery.findMany({
        where: { schoolId },
        include: {
          subCategoryAdmin: {
            include: {
              category: { select: { name: true } },
              subCategory: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.query.findMany({
        where: { schoolAdmin: { schoolId } },
        include: {
          schoolAdmin: {
            include: { school: { select: { name: true, refNum: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { fromCategoryAdmins, fromSubCategoryAdmins, toSuperAdmin };
  }

  async raise(dto: MasterAdminRaiseQueryDto) {
    const school = await this.assertSchool(dto.schoolId);
    const poc = await this.resolveSchoolAdminPoc(dto.schoolId);
    const payload = this.prefixMessage(dto);

    if (dto.recipient === 'super_admin') {
      return this.schoolQueries.create(poc.id, payload);
    }
    if (dto.recipient === 'category_admin') {
      return this.schoolQueries.createToCategoryAdmin(poc.id, payload);
    }
    if (dto.recipient === 'subcategory_admin') {
      return this.schoolQueries.createToSubCategoryAdmin(poc.id, payload);
    }

    const message =
      dto.type === 'custom_message'
        ? dto.customMessage ?? dto.description ?? ''
        : dto.description ?? 'Meeting request from Master Admin';
    const schoolAdmins = await this.prisma.schoolAdmin.findMany({
      where: { schoolId: dto.schoolId, isActive: true },
      select: { name: true, email: true },
    });
    if (schoolAdmins.length === 0) {
      throw new BadRequestException('No school admins to notify.');
    }
    for (const admin of schoolAdmins) {
      await this.emailService.sendCategoryAdminQueryToSchoolAdmin(
        admin.email,
        'Master Admin',
        'master.admin@sembuzz.local',
        school.name,
        'School-wide',
        {
          type: dto.type,
          description: `${MASTER_ADMIN_PREFIX}\n\n${message}`,
          meetingType: dto.meetingType,
          timeZone: dto.timeZone,
          timeSlot: dto.timeSlot,
          attachmentUrl: dto.attachmentUrl,
        },
      );
    }
    return { message: `Notification sent to ${schoolAdmins.length} school admin(s).`, notified: schoolAdmins.length };
  }

  async replyToCategoryAdmin(schoolId: string, queryId: string, message: string) {
    await this.assertSchool(schoolId);
    const q = await this.prisma.categoryAdminQuery.findFirst({ where: { id: queryId, schoolId } });
    if (!q) throw new NotFoundException('Query not found');
    return this.schoolQueries.replyToCategoryAdmin(queryId, `${MASTER_ADMIN_PREFIX} ${message}`);
  }

  async replyToSubcategoryAdmin(schoolId: string, queryId: string, message: string) {
    await this.assertSchool(schoolId);
    const q = await this.prisma.subCategoryAdminToSchoolAdminQuery.findFirst({ where: { id: queryId, schoolId } });
    if (!q) throw new NotFoundException('Query not found');
    const poc = await this.resolveSchoolAdminPoc(schoolId);
    return this.schoolQueries.replyToSubcategoryAdmin(poc.id, queryId, `${MASTER_ADMIN_PREFIX} ${message}`);
  }

  async sendDeveloperRequest(dto: MasterAdminDeveloperRequestDto) {
    const school = await this.assertSchool(dto.schoolId);
    let meetingLink: string | null = null;
    let meetingError: string | null = null;

    if (
      dto.type === 'schedule_meeting' &&
      dto.meetingType &&
      dto.meetingDate &&
      dto.timeSlot &&
      dto.timeZone &&
      (dto.meetingType === 'google_meet' || dto.meetingType === 'zoom')
    ) {
      const dateStr = dto.meetingDate.split('T')[0];
      const result = await this.meetingsService.scheduleMeeting({
        meetingType: dto.meetingType as 'google_meet' | 'zoom',
        meetingDate: dateStr,
        timeSlot: dto.timeSlot,
        timeZone: dto.timeZone,
        title: `SemBuzz Support — ${school.name}`,
        attendeeEmails: [SUPPORT_EMAIL],
      });
      if (!('error' in result)) {
        meetingLink = result.meetingLink;
      } else {
        meetingError = result.error;
        console.warn('[MasterAdminQueriesService] Meeting could not be created:', result.error);
      }
    }

    await this.emailService.sendDeveloperSupportRequest(
      {
        type: dto.type,
        description: dto.description,
        meetingType: dto.meetingType,
        timeZone: dto.timeZone,
        timeSlot: dto.timeSlot,
        customMessage: dto.customMessage,
        meetingLink: meetingLink ?? undefined,
        meetingError: meetingError ?? undefined,
      },
      undefined,
      { requesterRole: 'Master Admin', schoolName: school.name },
    );

    return { message: 'Support request sent successfully', meetingLink: meetingLink ?? undefined };
  }
}
