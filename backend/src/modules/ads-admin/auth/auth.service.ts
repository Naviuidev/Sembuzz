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
import { AdsAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { EmailService } from '../../super-admin/schools/email.service';

@Injectable()
export class AdsAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /** Cast so generated delegates (adsAdmin, adsAdminPasswordResetOtp) are accepted; run `npx prisma generate` so runtime client matches. */
  private get client() {
    return this.prisma as any;
  }

  async login(loginDto: AdsAdminLoginDto) {
    const { email, password } = loginDto;

    const admin = await this.client.adsAdmin.findUnique({
      where: { email: email.trim() },
      include: {
        school: { select: { id: true, name: true } },
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
      schoolId: admin.schoolId,
      role: 'ads_admin',
      isFirstLogin: admin.isFirstLogin,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
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

    const admin = await this.client.adsAdmin.findUnique({
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

    await this.client.adsAdmin.update({
      where: { id: adminId },
      data: {
        password: hashedNewPassword,
        isFirstLogin: false,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async validateUser(userId: string) {
    const admin = await this.client.adsAdmin.findUnique({
      where: { id: userId },
      include: {
        school: { select: { id: true, name: true } },
      },
    });

    if (!admin) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      schoolId: admin.schoolId,
      schoolName: admin.school.name,
      isFirstLogin: admin.isFirstLogin,
    };
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;

    const admin = await this.client.adsAdmin.findUnique({
      where: { email: email.trim(), isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('No ads admin found with this email address');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.client.adsAdminPasswordResetOtp.updateMany({
      where: { adsAdminId: admin.id, isUsed: false },
      data: { isUsed: true },
    });

    await this.client.adsAdminPasswordResetOtp.create({
      data: {
        adsAdminId: admin.id,
        otp,
        expiresAt,
      },
    });

    try {
      await this.emailService.sendAdsAdminPasswordResetOtp(admin.email, admin.name, otp);
    } catch (emailErr) {
      if (process.env.NODE_ENV !== 'production') {
        return {
          message: 'OTP has been sent to your registered email address',
          email: admin.email.substring(0, 3) + '***' + admin.email.substring(admin.email.indexOf('@')),
          devOtp: otp,
        };
      }
      throw emailErr;
    }

    return {
      message: 'OTP has been sent to your registered email address',
      email: admin.email.substring(0, 3) + '***' + admin.email.substring(admin.email.indexOf('@')),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const admin = await this.client.adsAdmin.findUnique({
      where: { email: email.trim(), isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('No ads admin found with this email address');
    }

    const otpRecord = await this.client.adsAdminPasswordResetOtp.findFirst({
      where: {
        adsAdminId: admin.id,
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

    const admin = await this.client.adsAdmin.findUnique({
      where: { email: email.trim(), isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('No ads admin found with this email address');
    }

    const otpRecord = await this.client.adsAdminPasswordResetOtp.findFirst({
      where: {
        adsAdminId: admin.id,
        otp,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.client.$transaction([
      this.client.adsAdmin.update({
        where: { id: admin.id },
        data: { password: hashedPassword, isFirstLogin: false },
      }),
      this.client.adsAdminPasswordResetOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return { message: 'Password reset successfully. Please login with your new password.' };
  }
}
