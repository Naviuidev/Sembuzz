import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SchoolAdminDirectChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(schoolId: string) {
    const row = await this.prisma.schoolDirectMessagingSetting.findUnique({
      where: { schoolId },
      select: { isEnabled: true },
    });
    return { isEnabled: row?.isEnabled ?? true };
  }

  async updateSetting(schoolId: string, isEnabled: boolean) {
    const row = await this.prisma.schoolDirectMessagingSetting.upsert({
      where: { schoolId },
      create: { schoolId, isEnabled },
      update: { isEnabled },
      select: { isEnabled: true },
    });
    return row;
  }
}
