import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { MasterAdminLoginDto } from '../dto/login.dto';
import { SetMasterAdminPasswordDto } from '../dto/set-master-admin-password.dto';
import { MasterAdminJwtPayload } from '../types/master-admin-jwt.types';

const MASTER_ADMIN_ID = 'master-admin';

function safeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class MasterAdminAuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private getExpectedCredentials() {
    const loginId =
      this.configService.get<string>('MASTER_ADMIN_LOGIN_ID')?.trim() || 'Sembuzz';
    const password =
      this.configService.get<string>('MASTER_ADMIN_PASSWORD')?.trim() || 'Sembuzz@1998';
    return { loginId, password };
  }

  private signPlatformMaster(loginId: string) {
    const payload: MasterAdminJwtPayload = {
      sub: MASTER_ADMIN_ID,
      loginId,
      role: 'master_admin',
      name: 'Master Admin',
      isFirstLogin: false,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: MASTER_ADMIN_ID,
        role: 'master_admin' as const,
        loginId,
        name: 'Master Admin',
        email: null,
        schoolId: null,
        schoolName: null,
        allowedPortalSections: null,
        isFirstLogin: false,
      },
    };
  }

  private async signSchoolMasterAdmin(admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    schoolId: string;
    isFirstLogin: boolean;
    allowedPortalSections: unknown;
    school: { name: string };
  }) {
    const sections = Array.isArray(admin.allowedPortalSections)
      ? (admin.allowedPortalSections as string[])
      : [];
    const name = `${admin.firstName} ${admin.lastName}`.trim();
    const payload: MasterAdminJwtPayload = {
      sub: admin.id,
      role: 'school_master_admin',
      email: admin.email,
      name,
      schoolId: admin.schoolId,
      schoolName: admin.school.name,
      allowedPortalSections: sections,
      isFirstLogin: admin.isFirstLogin,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: admin.id,
        role: 'school_master_admin' as const,
        loginId: admin.email,
        name,
        email: admin.email,
        schoolId: admin.schoolId,
        schoolName: admin.school.name,
        allowedPortalSections: sections,
        isFirstLogin: admin.isFirstLogin,
      },
    };
  }

  async login(loginDto: MasterAdminLoginDto) {
    const { identifier, password } = loginDto;
    const { loginId, password: expectedPassword } = this.getExpectedCredentials();

    const idOk = safeStringEqual(identifier.trim(), loginId);
    const passwordOk = safeStringEqual(password, expectedPassword);
    if (idOk && passwordOk) {
      return this.signPlatformMaster(loginId);
    }

    const email = identifier.trim().toLowerCase();
    const schoolAdmin = await this.prisma.schoolMasterAdmin.findFirst({
      where: { email, isActive: true },
      include: { school: { select: { name: true } } },
    });
    if (!schoolAdmin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, schoolAdmin.password);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signSchoolMasterAdmin(schoolAdmin);
  }

  async getProfile(jwt: MasterAdminJwtPayload) {
    if (jwt.role === 'master_admin' || jwt.sub === MASTER_ADMIN_ID) {
      const { loginId } = this.getExpectedCredentials();
      return {
        id: MASTER_ADMIN_ID,
        role: 'master_admin' as const,
        loginId,
        name: 'Master Admin',
        email: null,
        schoolId: null,
        schoolName: null,
        allowedPortalSections: null,
        isFirstLogin: false,
      };
    }

    const admin = await this.prisma.schoolMasterAdmin.findFirst({
      where: { id: jwt.sub, isActive: true },
      include: { school: { select: { id: true, name: true } } },
    });
    if (!admin) {
      throw new UnauthorizedException('User not found');
    }

    const sections = Array.isArray(admin.allowedPortalSections)
      ? (admin.allowedPortalSections as string[])
      : [];

    return {
      id: admin.id,
      role: 'school_master_admin' as const,
      loginId: admin.email,
      name: `${admin.firstName} ${admin.lastName}`.trim(),
      email: admin.email,
      schoolId: admin.schoolId,
      schoolName: admin.school.name,
      allowedPortalSections: sections,
      isFirstLogin: admin.isFirstLogin,
    };
  }

  async setPassword(adminId: string, dto: SetMasterAdminPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const admin = await this.prisma.schoolMasterAdmin.findFirst({
      where: { id: adminId, isActive: true },
    });
    if (!admin) {
      throw new UnauthorizedException('User not found');
    }

    const currentOk = await bcrypt.compare(dto.currentPassword, admin.password);
    if (!currentOk) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.schoolMasterAdmin.update({
      where: { id: admin.id },
      data: { password: hashed, isFirstLogin: false },
    });

    const updated = await this.prisma.schoolMasterAdmin.findUniqueOrThrow({
      where: { id: admin.id },
      include: { school: { select: { name: true } } },
    });

    return this.signSchoolMasterAdmin(updated);
  }
}
