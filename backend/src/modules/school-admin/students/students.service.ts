import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SchoolAdminStudentsService {
  constructor(private prisma: PrismaService) {}

  private userSelect = {
    id: true,
    email: true,
    name: true,
    firstName: true,
    lastName: true,
    profilePicUrl: true,
    verificationDocUrl: true,
    additionalVerificationDocUrl: true,
    registrationMethod: true,
    status: true,
    createdAt: true,
  };

  async findApprovedForSchool(schoolId: string) {
    return this.prisma.user.findMany({
      where: {
        schoolId,
        registrationMethod: 'gmail',
        status: { in: ['active', 'banned'] },
      },
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAutomatedForSchool(schoolId: string) {
    return this.prisma.user.findMany({
      where: {
        schoolId,
        registrationMethod: 'school_domain',
        status: { in: ['active', 'banned'] },
      },
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async ban(userId: string, schoolId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, schoolId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status === 'banned') {
      throw new BadRequestException('User is already banned');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'banned' },
    });
    return { success: true };
  }

  async unban(userId: string, schoolId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, schoolId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status !== 'banned') {
      throw new BadRequestException('User is not banned');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
    });
    return { success: true };
  }
}
