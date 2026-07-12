import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../super-admin/schools/email.service';

export type MembershipStatus = 'pending' | 'approved' | 'banned';

@Injectable()
export class CategoryAdminClubGroupMembershipsService {
  private readonly logger = new Logger(CategoryAdminClubGroupMembershipsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async listForSchool(schoolId: string, status: MembershipStatus) {
    return this.prisma.clubGroupMembership.findMany({
      where: { schoolId, status },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        reviewedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePicUrl: true,
            registrationMethod: true,
            createdAt: true,
          },
        },
        school: { select: { id: true, name: true } },
        groupChat: {
          select: {
            id: true,
            pageName: true,
            icon: true,
            clubKey: true,
          },
        },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  private async getMembershipForSchool(membershipId: string, schoolId: string) {
    const row = await this.prisma.clubGroupMembership.findFirst({
      where: { id: membershipId, schoolId },
    });
    if (!row) throw new NotFoundException('Membership request not found.');
    return row;
  }

  async approve(membershipId: string, schoolId: string, categoryAdminId: string) {
    const row = await this.getMembershipForSchool(membershipId, schoolId);
    if (row.status === 'approved') {
      return { id: row.id, status: row.status as MembershipStatus };
    }

    const shouldNotify = row.status === 'pending' || row.status === 'banned';
    const updated = await this.prisma.clubGroupMembership.update({
      where: { id: membershipId },
      data: {
        status: 'approved',
        reviewedByCategoryAdminId: categoryAdminId,
        reviewedAt: new Date(),
      },
      select: { id: true, status: true },
    });

    if (shouldNotify) {
      await this.sendJoinApprovedEmail(membershipId);
    }

    return updated;
  }

  private async sendJoinApprovedEmail(membershipId: string) {
    const details = await this.prisma.clubGroupMembership.findUnique({
      where: { id: membershipId },
      select: {
        user: {
          select: { email: true, name: true, firstName: true, lastName: true },
        },
        school: { select: { name: true } },
        groupChat: { select: { pageName: true, icon: true } },
      },
    });

    const email = details?.user?.email?.trim();
    if (!email || !details?.school || !details?.groupChat) return;

    const userName =
      details.user.name?.trim() ||
      [details.user.firstName, details.user.lastName].filter(Boolean).join(' ').trim() ||
      'there';
    const groupName = [details.groupChat.icon, details.groupChat.pageName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const appsUrl = `${frontendUrl}/events?tab=apps`;

    try {
      await this.emailService.sendClubGroupJoinApprovedEmail(
        email,
        userName,
        details.school.name,
        groupName || 'your club group',
        appsUrl,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send club group approval email to ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async ban(membershipId: string, schoolId: string, categoryAdminId: string) {
    await this.getMembershipForSchool(membershipId, schoolId);
    return this.prisma.clubGroupMembership.update({
      where: { id: membershipId },
      data: {
        status: 'banned',
        reviewedByCategoryAdminId: categoryAdminId,
        reviewedAt: new Date(),
      },
      select: { id: true, status: true },
    });
  }
}
