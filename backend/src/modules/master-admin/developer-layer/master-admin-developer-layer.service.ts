import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../super-admin/schools/email.service';
import { ProvisionSchoolMasterAdminDto } from './dto/provision-school-master-admin.dto';

@Injectable()
export class MasterAdminDeveloperLayerService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async listAdmins() {
    const rows = await this.prisma.schoolMasterAdmin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accessMethod: true,
        isActive: true,
        isFirstLogin: true,
        allowedPortalSections: true,
        createdAt: true,
        school: { select: { id: true, name: true, refNum: true, image: true } },
      },
    });
    return rows.map((row) => ({
      ...row,
      allowedPortalSections: Array.isArray(row.allowedPortalSections)
        ? (row.allowedPortalSections as string[])
        : [],
    }));
  }

  async provisionEmailAccess(dto: ProvisionSchoolMasterAdminDto) {
    if (dto.accessMethod === 'sso') {
      throw new BadRequestException('SSO access provisioning is not available yet. Choose email access.');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
      select: { id: true, name: true, refNum: true, isActive: true },
    });
    if (!school) throw new NotFoundException('School not found');

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.schoolMasterAdmin.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A school master admin already exists for this email.');
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashed = await bcrypt.hash(tempPassword, 10);
    const name = `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim();

    const admin = await this.prisma.schoolMasterAdmin.create({
      data: {
        schoolId: school.id,
        email,
        password: hashed,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        accessMethod: 'email',
        verificationDocumentUrl: dto.verificationDocumentUrl?.trim() || null,
        allowedPortalSections: dto.allowedPortalSections,
        isFirstLogin: true,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        school: { select: { id: true, name: true, refNum: true } },
        allowedPortalSections: true,
        createdAt: true,
      },
    });

    await this.emailService.sendSchoolMasterAdminOnboardingEmail({
      adminEmail: email,
      adminName: name,
      schoolName: school.name,
      schoolRefNum: school.refNum,
      tempPassword,
    });

    return {
      ...admin,
      allowedPortalSections: dto.allowedPortalSections,
      emailSent: true,
    };
  }
}
