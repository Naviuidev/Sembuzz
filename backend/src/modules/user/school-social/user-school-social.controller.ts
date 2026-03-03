import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UserGuard } from '../guards/user.guard';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('user/school-social-accounts')
@UseGuards(UserGuard)
export class UserSchoolSocialController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Request() req: { user: { sub: string } }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { schoolId: true },
    });
    if (!user?.schoolId) return [];
    return this.prisma.schoolSocialAccount.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platformId: true,
        platformName: true,
        pageName: true,
        icon: true,
        link: true,
      },
    });
  }
}
