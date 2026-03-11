import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../super-admin/schools/email.service';

@Injectable()
export class PendingUsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  async findPendingForSchool(schoolId: string) {
    return this.prisma.user.findMany({
      where: { schoolId, status: 'pending_approval' },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        profilePicUrl: true,
        verificationDocUrl: true,
        additionalVerificationDocUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(userId: string, schoolId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, schoolId },
      include: { school: { select: { name: true } } },
    });
    if (!user) {
      throw new NotFoundException('Pending user not found');
    }
    if (user.status !== 'pending_approval') {
      throw new BadRequestException('User is not pending approval');
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const token = this.jwtService.sign(
      { sub: user.id, purpose: 'approval_email_verify' },
      { expiresIn: '7d' },
    );
    const verifyLink = `${frontendUrl}/verify-approval?token=${encodeURIComponent(token)}`;
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
    console.log('[PendingUsersService] Sending approval email to', user.email, 'with verify link');
    try {
      await this.emailService.sendApprovalEmailWithVerifyLink(
        user.email,
        userName,
        user.school.name,
        verifyLink,
      );
    } catch (err) {
      console.error('[PendingUsersService] Approval email failed:', err);
      throw new BadRequestException(
        'User was not approved. We couldn\'t send the approval email. Please try again.',
      );
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
    });
    return { success: true };
  }

  async reject(userId: string, schoolId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, schoolId },
      include: { school: { select: { name: true } } },
    });
    if (!user) {
      throw new NotFoundException('Pending user not found');
    }
    if (user.status !== 'pending_approval') {
      throw new BadRequestException('User is not pending approval');
    }
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
    try {
      await this.emailService.sendRejectionEmailToUser(
        user.email,
        userName,
        user.school.name,
      );
    } catch (err) {
      console.error('[PendingUsersService] Rejection email failed:', err);
      throw new BadRequestException(
        'We couldn\'t send the rejection email. Please try again.',
      );
    }
    await this.prisma.user.delete({
      where: { id: userId },
    });
    return { success: true };
  }

  async requestDocs(userId: string, schoolId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, schoolId },
      include: { school: { select: { name: true } } },
    });
    if (!user) {
      throw new NotFoundException('Pending user not found');
    }
    if (user.status !== 'pending_approval') {
      throw new BadRequestException('User is not pending approval');
    }
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
    try {
      await this.emailService.sendDocumentRequestToUser(
        user.email,
        userName,
        user.school.name,
      );
    } catch (err) {
      console.error('[PendingUsersService] requestDocs email failed:', err);
      throw new BadRequestException(
        'We couldn\'t send the document request email. Please try again or approve/deny directly.',
      );
    }
    return { success: true };
  }

  async askReupload(userId: string, schoolId: string, message: string, type: 'reupload' | 'additional' = 'reupload') {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, schoolId },
      include: { school: { select: { name: true } } },
    });
    if (!user) {
      throw new NotFoundException('Pending user not found');
    }
    if (user.status !== 'pending_approval') {
      throw new BadRequestException('User is not pending approval');
    }
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
    const trimmedMessage = (message || '').trim();
    if (!trimmedMessage) {
      throw new BadRequestException('Please provide a message to send to the student.');
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const token = this.jwtService.sign(
      { sub: user.id, type, purpose: 'update_verification_doc' },
      { expiresIn: '7d' },
    );
    const updateDocLink = `${frontendUrl}/update-verification-doc?token=${encodeURIComponent(token)}`;
    console.log('[PendingUsersService] Reupload email link generated:', updateDocLink.substring(0, 80) + '...');
    try {
      await this.emailService.sendReuploadRequestToUser(
        user.email,
        userName,
        user.school.name,
        trimmedMessage,
        type,
        updateDocLink,
      );
    } catch (err) {
      console.error('[PendingUsersService] askReupload email failed:', err);
      throw new BadRequestException(
        'We couldn\'t send the reupload request email. Please try again.',
      );
    }
    return { success: true };
  }
}
