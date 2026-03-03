import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SchoolAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { EmailService } from '../../super-admin/schools/email.service';

@Injectable()
export class SchoolAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(loginDto: SchoolAdminLoginDto) {
    const { identifier, password } = loginDto;

    // Find school admin by email or refNum
    const admin = await this.prisma.schoolAdmin.findFirst({
      where: {
        OR: [
          { email: identifier },
          {
            school: {
              refNum: identifier,
            },
          },
        ],
        isActive: true,
      },
      include: {
        school: {
          include: {
            features: {
              where: { isEnabled: true },
              include: {
                feature: true,
              },
            },
          },
        },
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      schoolId: admin.schoolId,
      role: 'school_admin',
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
        refNum: admin.school.refNum,
        isFirstLogin: admin.isFirstLogin,
        schoolDomain: admin.school.domain || null,
        features: admin.school.features.map((sf) => ({
          code: sf.feature.code,
          name: sf.feature.name,
        })),
      },
    };
  }

  async changePassword(adminId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const admin = await this.prisma.schoolAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.schoolAdmin.update({
      where: { id: adminId },
      data: {
        password: hashedNewPassword,
        isFirstLogin: false, // Mark as password changed
      },
    });

    return { message: 'Password changed successfully' };
  }

  async validateUser(userId: string) {
    const admin = await this.prisma.schoolAdmin.findUnique({
      where: { id: userId },
      include: {
        school: {
          include: {
            features: {
              where: { isEnabled: true },
              include: {
                feature: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
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
      schoolId: admin.schoolId,
      schoolName: admin.school.name,
      refNum: admin.school.refNum,
      isFirstLogin: admin.isFirstLogin,
      schoolDomain: admin.school.domain || null,
      features: admin.school.features.map((sf) => ({
        code: sf.feature.code,
        name: sf.feature.name,
      })),
    };
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { refNum } = requestOtpDto;

    // Find school admin by refNum
    const admin = await this.prisma.schoolAdmin.findFirst({
      where: {
        school: {
          refNum: refNum,
        },
        isActive: true,
      },
      include: {
        school: {
          select: {
            name: true,
            refNum: true,
          },
        },
      },
    });

    if (!admin) {
      throw new NotFoundException('School admin not found with the provided reference number');
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Invalidate any existing unused OTPs for this admin
    await this.prisma.passwordResetOtp.updateMany({
      where: {
        schoolAdminId: admin.id,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Create new OTP
    await this.prisma.passwordResetOtp.create({
      data: {
        schoolAdminId: admin.id,
        otp,
        expiresAt,
      },
    });

    // Send OTP email
    await this.emailService.sendOtpEmail(admin.email, admin.school.name, refNum, otp);

    return {
      message: 'OTP has been sent to your registered email address',
      email: admin.email.substring(0, 3) + '***' + admin.email.substring(admin.email.indexOf('@')),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { refNum, otp } = verifyOtpDto;

    // Find school admin by refNum
    const admin = await this.prisma.schoolAdmin.findFirst({
      where: {
        school: {
          refNum: refNum,
        },
        isActive: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('School admin not found');
    }

    // Find valid OTP
    const otpRecord = await this.prisma.passwordResetOtp.findFirst({
      where: {
        schoolAdminId: admin.id,
        otp,
        isUsed: false,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    return {
      message: 'OTP verified successfully',
      verified: true,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { refNum, otp, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    // Find school admin by refNum
    const admin = await this.prisma.schoolAdmin.findFirst({
      where: {
        school: {
          refNum: refNum,
        },
        isActive: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('School admin not found');
    }

    // Verify OTP
    const otpRecord = await this.prisma.passwordResetOtp.findFirst({
      where: {
        schoolAdminId: admin.id,
        otp,
        isUsed: false,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark OTP as used
    await this.prisma.$transaction([
      this.prisma.schoolAdmin.update({
        where: { id: admin.id },
        data: {
          password: hashedPassword,
          isFirstLogin: false,
        },
      }),
      this.prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return {
      message: 'Password reset successfully. Please login with your new password.',
    };
  }
}
