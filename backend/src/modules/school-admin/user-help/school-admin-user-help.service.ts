import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SchoolAdminUserHelpService {
  constructor(private prisma: PrismaService) {}

  async findAllForSchool(schoolId: string) {
    return this.prisma.userHelpQuery.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
