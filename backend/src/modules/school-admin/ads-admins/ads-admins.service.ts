import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformUserService } from '../../platform-user/platform-user.service';

@Injectable()
export class SchoolAdminAdsAdminsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformUserService: PlatformUserService,
  ) {}

  async findAll(schoolId: string) {
    const rows = await this.prisma.adsAdmin.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platformUserId: true,
        name: true,
        email: true,
        isActive: true,
        isFirstLogin: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      userId: row.platformUserId,
      name: row.name,
      email: row.email,
      isActive: row.isActive,
      isFirstLogin: row.isFirstLogin,
      createdAt: row.createdAt,
    }));
  }

  async updateEmail(id: string, schoolId: string, email: string) {
    const admin = await this.prisma.adsAdmin.findFirst({
      where: { id, schoolId },
      select: { id: true, platformUserId: true, email: true, name: true },
    });
    if (!admin) {
      throw new NotFoundException('Ads admin not found.');
    }

    await this.platformUserService.updateEmail(admin.platformUserId, email);

    const refreshed = await this.prisma.adsAdmin.findUniqueOrThrow({
      where: { id: admin.id },
      select: {
        id: true,
        platformUserId: true,
        name: true,
        email: true,
        isActive: true,
        isFirstLogin: true,
        createdAt: true,
      },
    });

    return {
      id: refreshed.id,
      userId: refreshed.platformUserId,
      name: refreshed.name,
      email: refreshed.email,
      isActive: refreshed.isActive,
      isFirstLogin: refreshed.isFirstLogin,
      createdAt: refreshed.createdAt,
    };
  }
}
