import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformUserService } from '../../platform-user/platform-user.service';
import { ChangePasswordDto } from '../../school-admin/dto/change-password.dto';
import { ExternalAdminLoginDto } from '../dto/login.dto';

@Injectable()
export class ExternalAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private platformUserService: PlatformUserService,
  ) {}

  async login(loginDto: ExternalAdminLoginDto) {
    const { identifier, password } = loginDto;
    const normalizedEmail = identifier.includes('@')
      ? this.platformUserService.normalizeEmail(identifier)
      : null;

    let admin = null as Awaited<ReturnType<typeof this.prisma.externalAdmin.findFirst>> & {
      categories: Array<{ externalCategory: { id: string; name: string; isActive: boolean } }>;
    } | null;

    const categoryInclude = {
      categories: {
        include: {
          externalCategory: { select: { id: true, name: true, isActive: true } },
        },
      },
    };

    if (normalizedEmail) {
      const platformUser = await this.platformUserService.findByEmail(normalizedEmail);
      if (platformUser) {
        admin = await this.prisma.externalAdmin.findFirst({
          where: { platformUserId: platformUser.id, isActive: true },
          include: categoryInclude,
        });
      }
    } else {
      admin = await this.prisma.externalAdmin.findFirst({
        where: { refNum: identifier.trim(), isActive: true },
        include: categoryInclude,
      });
    }

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const categories = admin.categories
      .map((c) => c.externalCategory)
      .filter((c) => c.isActive);

    const payload = {
      sub: admin.id,
      userId: admin.platformUserId,
      email: admin.email,
      role: 'external_admin',
      isFirstLogin: admin.isFirstLogin,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: admin.id,
        userId: admin.platformUserId,
        name: admin.name,
        email: admin.email,
        refNum: admin.refNum,
        isFirstLogin: admin.isFirstLogin,
        categories,
      },
    };
  }

  async changePassword(adminId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const admin = await this.prisma.externalAdmin.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.externalAdmin.update({
      where: { id: adminId },
      data: { password: hashedNewPassword, isFirstLogin: false },
    });

    return { message: 'Password changed successfully' };
  }

  async validateUser(adminId: string) {
    const admin = await this.prisma.externalAdmin.findUnique({
      where: { id: adminId },
      include: {
        categories: {
          include: {
            externalCategory: { select: { id: true, name: true, isActive: true } },
          },
        },
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: admin.id,
      userId: admin.platformUserId,
      name: admin.name,
      email: admin.email,
      refNum: admin.refNum,
      isFirstLogin: admin.isFirstLogin,
      categories: admin.categories.map((c) => c.externalCategory).filter((c) => c.isActive),
    };
  }
}
