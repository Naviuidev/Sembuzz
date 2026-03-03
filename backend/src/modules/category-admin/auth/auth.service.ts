import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CategoryAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { EmailService } from '../../super-admin/schools/email.service';

@Injectable()
export class CategoryAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(loginDto: CategoryAdminLoginDto) {
    const { email, password } = loginDto;

    // Find category admin by email
    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { email },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      categoryId: admin.categoryId,
      schoolId: admin.schoolId,
      role: 'category_admin',
      isFirstLogin: admin.isFirstLogin,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        categoryId: admin.categoryId,
        categoryName: admin.category.name,
        schoolId: admin.schoolId,
        schoolName: admin.school.name,
        isFirstLogin: admin.isFirstLogin,
      },
    };
  }

  async changePassword(adminId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.categoryAdmin.update({
      where: { id: adminId },
      data: {
        password: hashedNewPassword,
        isFirstLogin: false,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async validateUser(userId: string) {
    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { id: userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!admin) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      categoryId: admin.categoryId,
      categoryName: admin.category.name,
      schoolId: admin.schoolId,
      schoolName: admin.school.name,
      schoolDomain: admin.school.domain || null,
      isFirstLogin: admin.isFirstLogin,
    };
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;

    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { email: email.trim(), isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('No category admin found with this email address');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.categoryAdminPasswordResetOtp.updateMany({
      where: { categoryAdminId: admin.id, isUsed: false },
      data: { isUsed: true },
    });

    await this.prisma.categoryAdminPasswordResetOtp.create({
      data: {
        categoryAdminId: admin.id,
        otp,
        expiresAt,
      },
    });

    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    try {
      await this.emailService.sendCategoryAdminPasswordResetOtp(admin.email, admin.name, otp);
    } catch (emailErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[CategoryAdminAuth] OTP email failed (dev). OTP logged by EmailService.');
        return {
          message: 'OTP has been sent to your registered email address',
          email: admin.email.substring(0, 3) + '***' + admin.email.substring(admin.email.indexOf('@')),
          devOtp: otp,
        };
      }
      throw emailErr;
    }

    // Only in development when SMTP not configured: return devOtp. Never in production.
    const isDev = process.env.NODE_ENV !== 'production';
    const includeDevOtp = isDev && !smtpConfigured;
    return {
      message: 'OTP has been sent to your registered email address',
      email: admin.email.substring(0, 3) + '***' + admin.email.substring(admin.email.indexOf('@')),
      ...(includeDevOtp ? { devOtp: otp } : {}),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { email: email.trim(), isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('No category admin found with this email address');
    }

    const otpRecord = await this.prisma.categoryAdminPasswordResetOtp.findFirst({
      where: {
        categoryAdminId: admin.id,
        otp,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    return { message: 'OTP verified successfully', verified: true };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const admin = await this.prisma.categoryAdmin.findUnique({
      where: { email: email.trim(), isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('No category admin found with this email address');
    }

    const otpRecord = await this.prisma.categoryAdminPasswordResetOtp.findFirst({
      where: {
        categoryAdminId: admin.id,
        otp,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.categoryAdmin.update({
        where: { id: admin.id },
        data: { password: hashedPassword, isFirstLogin: false },
      }),
      this.prisma.categoryAdminPasswordResetOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return { message: 'Password reset successfully. Please login with your new password.' };
  }
}
