import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UserHelpService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, message: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    });
    if (!user) throw new ForbiddenException('User not found');
    return this.prisma.userHelpQuery.create({
      data: {
        userId,
        schoolId: user.schoolId,
        message: message.trim(),
      },
    });
  }

  async findMyQueries(userId: string) {
    return this.prisma.userHelpQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
