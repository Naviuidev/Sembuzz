import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

@Injectable()
export class SchoolAdminSocialAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForSchool(schoolId: string) {
    return this.prisma.schoolSocialAccount.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(schoolId: string, dto: CreateSocialAccountDto) {
    return this.prisma.schoolSocialAccount.create({
      data: {
        schoolId,
        platformId: dto.platformId,
        platformName: dto.platformName,
        pageName: dto.pageName,
        icon: dto.icon,
        link: dto.link,
      },
    });
  }

  async createMany(schoolId: string, dtos: CreateSocialAccountDto[]) {
    const created = await this.prisma.$transaction(
      dtos.map((dto) =>
        this.prisma.schoolSocialAccount.create({
          data: {
            schoolId,
            platformId: dto.platformId,
            platformName: dto.platformName,
            pageName: dto.pageName,
            icon: dto.icon,
            link: dto.link,
          },
        }),
      ),
    );
    return created;
  }

  async update(id: string, schoolId: string, dto: UpdateSocialAccountDto) {
    await this.findOne(id, schoolId);
    return this.prisma.schoolSocialAccount.update({
      where: { id, schoolId },
      data: {
        ...(dto.pageName !== undefined && { pageName: dto.pageName }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.link !== undefined && { link: dto.link }),
      },
    });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);
    await this.prisma.schoolSocialAccount.delete({
      where: { id, schoolId },
    });
    return { success: true };
  }

  private async findOne(id: string, schoolId: string) {
    const account = await this.prisma.schoolSocialAccount.findFirst({
      where: { id, schoolId },
    });
    if (!account) throw new NotFoundException('Social account not found');
    return account;
  }
}
