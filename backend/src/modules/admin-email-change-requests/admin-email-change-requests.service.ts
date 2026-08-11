import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../super-admin/schools/email.service';
import { PlatformUserService } from '../platform-user/platform-user.service';
import type { InitiateAdminEmailChangeDto } from './dto/initiate-admin-email-change.dto';

export type AdminEmailChangeTargetRole = 'category_admin' | 'subcategory_admin' | 'ads_admin';
export type AdminEmailChangeInitiatorRole = 'school_admin' | 'category_admin';

type TargetAdminInfo = {
  id: string;
  name: string;
  email: string;
};

@Injectable()
export class AdminEmailChangeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly platformUserService: PlatformUserService,
  ) {}

  private maskEmail(email: string): string {
    const at = email.indexOf('@');
    if (at <= 0) return '***';
    return `${email.slice(0, 3)}***${email.slice(at)}`;
  }

  private generateTemporaryPassword(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private roleLabel(role: AdminEmailChangeTargetRole): string {
    if (role === 'category_admin') return 'Category Admin';
    if (role === 'subcategory_admin') return 'Subcategory Admin';
    return 'Ads Admin';
  }

  private loginPathForRole(role: AdminEmailChangeTargetRole): string {
    if (role === 'category_admin') return '/category-admin/login';
    if (role === 'subcategory_admin') return '/subcategory-admin/login';
    return '/ads-admin/login';
  }

  private async resetTargetAdminPassword(
    targetRole: AdminEmailChangeTargetRole,
    targetAdminId: string,
    hashedPassword: string,
  ): Promise<void> {
    const data = { password: hashedPassword, isFirstLogin: true };
    if (targetRole === 'category_admin') {
      await this.prisma.categoryAdmin.update({ where: { id: targetAdminId }, data });
      return;
    }
    if (targetRole === 'subcategory_admin') {
      await this.prisma.subCategoryAdmin.update({ where: { id: targetAdminId }, data });
      return;
    }
    await this.prisma.adsAdmin.update({ where: { id: targetAdminId }, data });
  }

  private async resolveInitiatorName(
    role: AdminEmailChangeInitiatorRole,
    adminId: string,
  ): Promise<string> {
    if (role === 'school_admin') {
      const row = await this.prisma.schoolAdmin.findUnique({
        where: { id: adminId },
        select: { name: true },
      });
      return row?.name ?? 'School admin';
    }
    const row = await this.prisma.categoryAdmin.findUnique({
      where: { id: adminId },
      select: { name: true },
    });
    return row?.name ?? 'Category admin';
  }

  private async categoryIdsForAdmin(categoryAdminId: string): Promise<string[]> {
    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { id: categoryAdminId },
      select: { categoryId: true, categories: { select: { categoryId: true } } },
    });
    if (!admin) return [];
    return [admin.categoryId, ...admin.categories.map((c) => c.categoryId)].filter(
      (id, i, arr) => arr.indexOf(id) === i,
    );
  }

  private async resolveTargetAdmin(
    schoolId: string,
    targetRole: AdminEmailChangeTargetRole,
    targetAdminId: string,
  ): Promise<TargetAdminInfo> {
    if (targetRole === 'category_admin') {
      const row = await this.prisma.categoryAdmin.findFirst({
        where: { id: targetAdminId, schoolId, isActive: true },
        select: { id: true, name: true, email: true },
      });
      if (!row) throw new NotFoundException('Category admin not found');
      return row;
    }
    if (targetRole === 'subcategory_admin') {
      const row = await this.prisma.subCategoryAdmin.findFirst({
        where: { id: targetAdminId, schoolId, isActive: true },
        select: { id: true, name: true, email: true },
      });
      if (!row) throw new NotFoundException('Subcategory admin not found');
      return row;
    }
    const row = await this.prisma.adsAdmin.findFirst({
      where: { id: targetAdminId, schoolId, isActive: true },
      select: { id: true, name: true, email: true },
    });
    if (!row) throw new NotFoundException('Ads admin not found');
    return row;
  }

  private async getTargetPlatformUserId(
    schoolId: string,
    targetRole: AdminEmailChangeTargetRole,
    targetAdminId: string,
  ): Promise<string> {
    if (targetRole === 'category_admin') {
      const row = await this.prisma.categoryAdmin.findFirst({
        where: { id: targetAdminId, schoolId },
        select: { platformUserId: true },
      });
      if (!row) throw new NotFoundException('Category admin not found');
      return row.platformUserId;
    }
    if (targetRole === 'subcategory_admin') {
      const row = await this.prisma.subCategoryAdmin.findFirst({
        where: { id: targetAdminId, schoolId },
        select: { platformUserId: true },
      });
      if (!row) throw new NotFoundException('Subcategory admin not found');
      return row.platformUserId;
    }
    const row = await this.prisma.adsAdmin.findFirst({
      where: { id: targetAdminId, schoolId },
      select: { platformUserId: true },
    });
    if (!row) throw new NotFoundException('Ads admin not found');
    return row.platformUserId;
  }

  private async assertCanInitiate(
    schoolId: string,
    initiatorRole: AdminEmailChangeInitiatorRole,
    initiatorAdminId: string,
    targetRole: AdminEmailChangeTargetRole,
    targetAdminId: string,
  ): Promise<void> {
    if (initiatorRole === 'school_admin') {
      await this.resolveTargetAdmin(schoolId, targetRole, targetAdminId);
      return;
    }

    if (initiatorRole === 'category_admin') {
      if (targetRole !== 'subcategory_admin') {
        throw new ForbiddenException('Category admins can only request email changes for subcategory admins');
      }
      const categoryIds = await this.categoryIdsForAdmin(initiatorAdminId);
      const sub = await this.prisma.subCategoryAdmin.findFirst({
        where: {
          id: targetAdminId,
          schoolId,
          isActive: true,
          categoryId: { in: categoryIds },
        },
        select: { id: true },
      });
      if (!sub) {
        throw new ForbiddenException('This subcategory admin is not in your categories');
      }
      return;
    }

    throw new ForbiddenException('Not allowed to initiate email change requests');
  }

  async initiate(
    schoolId: string,
    initiatorRole: AdminEmailChangeInitiatorRole,
    initiatorAdminId: string,
    dto: InitiateAdminEmailChangeDto,
  ) {
    await this.assertCanInitiate(
      schoolId,
      initiatorRole,
      initiatorAdminId,
      dto.targetRole,
      dto.targetAdminId,
    );

    const target = await this.resolveTargetAdmin(schoolId, dto.targetRole, dto.targetAdminId);
    const reason = dto.reason.trim();
    if (!reason) {
      throw new BadRequestException('Reason is required');
    }

    const existing = await this.prisma.adminEmailChangeRequest.findFirst({
      where: {
        schoolId,
        targetRole: dto.targetRole,
        targetAdminId: dto.targetAdminId,
        status: { in: ['pending_otp', 'pending'] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'An email change request is already in progress for this admin',
      );
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const initiatedByName = await this.resolveInitiatorName(initiatorRole, initiatorAdminId);

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });

    const request = await this.prisma.adminEmailChangeRequest.create({
      data: {
        schoolId,
        targetRole: dto.targetRole,
        targetAdminId: target.id,
        targetName: target.name,
        targetEmail: target.email,
        initiatedByRole: initiatorRole,
        initiatedByAdminId: initiatorAdminId,
        initiatedByName,
        reason,
        status: 'pending_otp',
        reviewerRole: 'school_admin',
        otp,
        otpExpiresAt,
      },
    });

    await this.emailService.sendAdminEmailChangeOtpEmail(
      target.email,
      target.name,
      school?.name ?? 'your school',
      otp,
    );

    return {
      requestId: request.id,
      maskedEmail: this.maskEmail(target.email),
      message: 'OTP sent to the admin’s current email address',
    };
  }

  async confirmOtp(
    schoolId: string,
    initiatorRole: AdminEmailChangeInitiatorRole,
    initiatorAdminId: string,
    requestId: string,
    otp: string,
  ) {
    const request = await this.prisma.adminEmailChangeRequest.findFirst({
      where: {
        id: requestId,
        schoolId,
        initiatedByRole: initiatorRole,
        initiatedByAdminId: initiatorAdminId,
      },
    });

    if (!request) {
      throw new NotFoundException('Email change request not found');
    }
    if (request.status !== 'pending_otp') {
      throw new BadRequestException('This request is no longer awaiting OTP verification');
    }
    if (request.otpUsed || !request.otp || !request.otpExpiresAt) {
      throw new BadRequestException('OTP has expired. Please start a new request.');
    }
    if (request.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please start a new request.');
    }
    if (request.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.adminEmailChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'pending',
        otpUsed: true,
      },
    });

    return {
      message: 'Email change request submitted to the school admin for review',
      requestId,
    };
  }

  async listPendingForSchoolAdmin(schoolId: string) {
    const rows = await this.prisma.adminEmailChangeRequest.findMany({
      where: { schoolId, status: { in: ['pending', 'pending_new_email_otp'] } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      targetRole: r.targetRole,
      targetAdminId: r.targetAdminId,
      targetName: r.targetName,
      targetEmail: r.targetEmail,
      initiatedByRole: r.initiatedByRole,
      initiatedByName: r.initiatedByName,
      reason: r.reason,
      status: r.status,
      proposedNewEmail: r.proposedNewEmail,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async configureNewEmail(
    schoolId: string,
    schoolAdminId: string,
    requestId: string,
    newEmail: string,
  ) {
    const request = await this.prisma.adminEmailChangeRequest.findFirst({
      where: { id: requestId, schoolId },
    });

    if (!request) {
      throw new NotFoundException('Email change request not found');
    }
    if (!['pending', 'pending_new_email_otp'].includes(request.status)) {
      throw new BadRequestException('This request is not awaiting email configuration');
    }

    const normalized = this.platformUserService.normalizeEmail(newEmail);
    if (normalized === this.platformUserService.normalizeEmail(request.targetEmail)) {
      throw new BadRequestException('New email must be different from the current email');
    }

    const taken = await this.platformUserService.findByEmail(normalized);
    if (taken) {
      const platformUserId = await this.getTargetPlatformUserId(
        schoolId,
        request.targetRole as AdminEmailChangeTargetRole,
        request.targetAdminId,
      );
      if (taken.id !== platformUserId) {
        throw new BadRequestException('Email is already in use by another account');
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });

    await this.prisma.adminEmailChangeRequest.update({
      where: { id: requestId },
      data: {
        proposedNewEmail: normalized,
        newEmailOtp: otp,
        newEmailOtpExpiresAt: otpExpiresAt,
        newEmailOtpUsed: false,
        status: 'pending_new_email_otp',
      },
    });

    await this.emailService.sendAdminEmailChangeNewEmailOtpEmail(
      normalized,
      request.targetName,
      school?.name ?? 'your school',
      otp,
    );

    return {
      message: 'OTP sent to the new email address',
      maskedEmail: this.maskEmail(normalized),
    };
  }

  async confirmNewEmailAndApply(
    schoolId: string,
    schoolAdminId: string,
    requestId: string,
    otp: string,
  ) {
    const request = await this.prisma.adminEmailChangeRequest.findFirst({
      where: { id: requestId, schoolId },
    });

    if (!request) {
      throw new NotFoundException('Email change request not found');
    }
    if (request.status !== 'pending_new_email_otp') {
      throw new BadRequestException('This request is not awaiting new email verification');
    }
    if (!request.proposedNewEmail || request.newEmailOtpUsed) {
      throw new BadRequestException('Please configure a new email first');
    }
    if (!request.newEmailOtp || !request.newEmailOtpExpiresAt) {
      throw new BadRequestException('OTP has expired. Please configure the email again.');
    }
    if (request.newEmailOtpExpiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please configure the email again.');
    }
    if (request.newEmailOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const targetRole = request.targetRole as AdminEmailChangeTargetRole;
    const platformUserId = await this.getTargetPlatformUserId(
      schoolId,
      targetRole,
      request.targetAdminId,
    );

    const tempPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.platformUserService.updateEmail(platformUserId, request.proposedNewEmail);
    await this.resetTargetAdminPassword(targetRole, request.targetAdminId, hashedPassword);

    await this.prisma.adminEmailChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        newEmailOtpUsed: true,
        reviewedAt: new Date(),
        reviewedByAdminId: schoolAdminId,
      },
    });

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });

    let welcomeEmailSent = false;
    try {
      await this.emailService.sendAdminEmailChangeWelcomeEmail(
        request.proposedNewEmail,
        request.targetName,
        school?.name ?? 'your school',
        this.roleLabel(targetRole),
        this.loginPathForRole(targetRole),
        tempPassword,
      );
      welcomeEmailSent = true;
    } catch (error) {
      console.error('Failed to send admin email-change welcome email:', error);
    }

    return {
      message: welcomeEmailSent
        ? 'Admin email updated. A welcome email with a temporary password was sent to the new address.'
        : 'Admin email updated. Welcome email could not be sent — share login details with the admin manually.',
      newEmail: request.proposedNewEmail,
      welcomeEmailSent,
    };
  }

  async countPendingForSchoolAdmin(schoolId: string): Promise<number> {
    return this.prisma.adminEmailChangeRequest.count({
      where: { schoolId, status: { in: ['pending', 'pending_new_email_otp'] } },
    });
  }
}
