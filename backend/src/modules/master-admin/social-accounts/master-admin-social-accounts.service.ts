import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSocialAccountDto } from '../../school-admin/social-accounts/dto/create-social-account.dto';
import { CreateMasterAdminSocialAccountDto } from './dto/create-master-admin-social-account.dto';
import { UpdateMasterAdminSocialAccountDto } from './dto/update-master-admin-social-account.dto';

@Injectable()
export class MasterAdminSocialAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  list(schoolId: string) {
    return this.prisma.schoolSocialAccount.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  getOne(id: string, schoolId: string) {
    return this.findOne(id, schoolId);
  }

  create(dto: CreateMasterAdminSocialAccountDto) {
    return this.prisma.schoolSocialAccount.create({
      data: {
        schoolId: dto.schoolId,
        platformId: dto.platformId,
        platformName: dto.platformName,
        pageName: dto.pageName,
        icon: dto.icon,
        link: dto.link,
      },
    });
  }

  createMany(schoolId: string, dtos: CreateSocialAccountDto[]) {
    return this.prisma.$transaction(
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
  }

  update(id: string, dto: UpdateMasterAdminSocialAccountDto) {
    return this.prisma.schoolSocialAccount.update({
      where: { id, schoolId: dto.schoolId },
      data: {
        ...(dto.pageName !== undefined && { pageName: dto.pageName }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.link !== undefined && { link: dto.link }),
      },
    });
  }

  async remove(id: string, schoolId: string) {
    await this.findOne(id, schoolId);
    await this.prisma.schoolSocialAccount.delete({ where: { id, schoolId } });
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
