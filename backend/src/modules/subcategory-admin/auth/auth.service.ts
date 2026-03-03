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
import { SubCategoryAdminLoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto, ResetPasswordDto } from '../dto/forgot-password.dto';
import { EmailService } from '../../super-admin/schools/email.service';

@Injectable()
export class SubCategoryAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(loginDto: SubCategoryAdminLoginDto) {
    const { email, password } = loginDto;

    // Find subcategory admin by email
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { email },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
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
      subCategoryId: admin.subCategoryId,
      categoryId: admin.categoryId,
      schoolId: admin.schoolId,
      role: 'subcategory_admin',
      isFirstLogin: admin.isFirstLogin,
    };

    // Get all subcategories from junction table
    const subCategories = await this.prisma.subCategoryAdminSubCategory.findMany({
      where: { subCategoryAdminId: admin.id },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const subCategoryNames = subCategories.length > 0
      ? subCategories.map((sc) => sc.subCategory.name)
      : [admin.subCategory.name];

    // Include category admin in login response so dashboard shows it without extra getMe call
    let loginCategoryAdmin = await this.prisma.categoryAdmin.findFirst({
      where: {
        schoolId: admin.schoolId,
        isActive: true,
        categories: { some: { categoryId: admin.categoryId } },
      },
      select: { id: true, name: true, email: true },
    });
    if (!loginCategoryAdmin) {
      loginCategoryAdmin = await this.prisma.categoryAdmin.findFirst({
        where: {
          schoolId: admin.schoolId,
          isActive: true,
          categoryId: admin.categoryId,
        },
        select: { id: true, name: true, email: true },
      });
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        subCategoryId: admin.subCategoryId,
        subCategoryName: admin.subCategory.name,
        subCategoryNames: subCategoryNames,
        subCategories: subCategories.length > 0
          ? subCategories.map((sc) => ({ id: sc.subCategory.id, name: sc.subCategory.name }))
          : [{ id: admin.subCategory.id, name: admin.subCategory.name }],
        categoryId: admin.categoryId,
        categoryName: admin.category.name,
        categoryAdmin: loginCategoryAdmin ? { id: loginCategoryAdmin.id, name: loginCategoryAdmin.name, email: loginCategoryAdmin.email } : null,
        schoolId: admin.schoolId,
        schoolName: admin.school.name,
        schoolDomain: admin.school.domain || null,
        isFirstLogin: admin.isFirstLogin,
      },
    };
  }

  async changePassword(adminId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const admin = await this.prisma.subCategoryAdmin.findUnique({
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

    await this.prisma.subCategoryAdmin.update({
      where: { id: adminId },
      data: {
        password: hashedNewPassword,
        isFirstLogin: false,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async validateUser(userId: string) {
    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { id: userId },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
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

    // Get all subcategories from junction table with their category info
    const subCategories = await this.prisma.subCategoryAdminSubCategory.findMany({
      where: { subCategoryAdminId: admin.id },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Get category admin who manages the category: try junction table first, then primary categoryId
    let categoryAdmin = await this.prisma.categoryAdmin.findFirst({
      where: {
        schoolId: admin.schoolId,
        isActive: true,
        categories: {
          some: { categoryId: admin.categoryId },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    if (!categoryAdmin) {
      categoryAdmin = await this.prisma.categoryAdmin.findFirst({
        where: {
          schoolId: admin.schoolId,
          isActive: true,
          categoryId: admin.categoryId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    }

    // Get all subcategory names (from junction table or fallback to primary)
    const subCategoryNames = subCategories.length > 0
      ? subCategories.map((sc) => sc.subCategory.name)
      : [admin.subCategory.name];

    // Group subcategories by category
    const categoriesWithSubcategories = subCategories.length > 0
      ? subCategories.reduce((acc, sc) => {
          const categoryId = sc.subCategory.categoryId;
          const categoryName = sc.subCategory.category.name;
          if (!acc[categoryId]) {
            acc[categoryId] = {
              id: categoryId,
              name: categoryName,
              subcategories: [],
            };
          }
          acc[categoryId].subcategories.push({
            id: sc.subCategory.id,
            name: sc.subCategory.name,
          });
          return acc;
        }, {} as Record<string, { id: string; name: string; subcategories: Array<{ id: string; name: string }> }>)
      : {
          [admin.categoryId]: {
            id: admin.categoryId,
            name: admin.category.name,
            subcategories: [{ id: admin.subCategory.id, name: admin.subCategory.name }],
          },
        };

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      subCategoryId: admin.subCategoryId,
      subCategoryName: admin.subCategory.name,
      subCategoryNames: subCategoryNames, // Array of all assigned subcategory names
      subCategories: subCategories.length > 0
        ? subCategories.map((sc) => ({
            id: sc.subCategory.id,
            name: sc.subCategory.name,
            categoryId: sc.subCategory.categoryId,
            categoryName: sc.subCategory.category.name,
          }))
        : [{
            id: admin.subCategory.id,
            name: admin.subCategory.name,
            categoryId: admin.categoryId,
            categoryName: admin.category.name,
          }],
      categoriesWithSubcategories: Object.values(categoriesWithSubcategories),
      categoryId: admin.categoryId,
      categoryName: admin.category.name,
      categoryAdmin: categoryAdmin ? {
        id: categoryAdmin.id,
        name: categoryAdmin.name,
        email: categoryAdmin.email,
      } : null,
      schoolId: admin.schoolId,
      schoolName: admin.school.name,
      schoolDomain: admin.school.domain || null,
      isFirstLogin: admin.isFirstLogin,
    };
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;

    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { email: email.trim(), isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('No subcategory admin found with this email address');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.subCategoryAdminPasswordResetOtp.updateMany({
      where: { subCategoryAdminId: admin.id, isUsed: false },
      data: { isUsed: true },
    });

    await this.prisma.subCategoryAdminPasswordResetOtp.create({
      data: {
        subCategoryAdminId: admin.id,
        otp,
        expiresAt,
      },
    });

    await this.emailService.sendSubCategoryAdminPasswordResetOtp(admin.email, admin.name, otp);

    return {
      message: 'OTP has been sent to your registered email address',
      email: admin.email.substring(0, 3) + '***' + admin.email.substring(admin.email.indexOf('@')),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { email: email.trim(), isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('No subcategory admin found with this email address');
    }

    const otpRecord = await this.prisma.subCategoryAdminPasswordResetOtp.findFirst({
      where: {
        subCategoryAdminId: admin.id,
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

    const admin = await this.prisma.subCategoryAdmin.findUnique({
      where: { email: email.trim(), isActive: true },
    });

    if (!admin) {
      throw new NotFoundException('No subcategory admin found with this email address');
    }

    const otpRecord = await this.prisma.subCategoryAdminPasswordResetOtp.findFirst({
      where: {
        subCategoryAdminId: admin.id,
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
      this.prisma.subCategoryAdmin.update({
        where: { id: admin.id },
        data: { password: hashedPassword, isFirstLogin: false },
      }),
      this.prisma.subCategoryAdminPasswordResetOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return { message: 'Password reset successfully. Please login with your new password.' };
  }
}
