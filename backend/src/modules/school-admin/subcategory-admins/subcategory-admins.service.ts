import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SchoolAdminSubcategoryAdminsService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string) {
    return this.prisma.subCategoryAdmin.findMany({
      where: { schoolId },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        subCategories: {
          include: {
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async ban(id: string, schoolId: string) {
    const admin = await this.prisma.subCategoryAdmin.findFirst({
      where: { id, schoolId },
    });
    if (!admin) {
      throw new NotFoundException('Subcategory admin not found');
    }
    if (!admin.isActive) {
      throw new BadRequestException('Subcategory admin is already banned');
    }
    return this.prisma.subCategoryAdmin.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async unban(id: string, schoolId: string) {
    const admin = await this.prisma.subCategoryAdmin.findFirst({
      where: { id, schoolId },
    });
    if (!admin) {
      throw new NotFoundException('Subcategory admin not found');
    }
    if (admin.isActive) {
      throw new BadRequestException('Subcategory admin is not banned');
    }
    return this.prisma.subCategoryAdmin.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
