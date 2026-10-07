import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ExternalAdminCategorySubcategoryLinksService {
  constructor(private prisma: PrismaService) {}

  async listSchoolSubcategories(externalAdminId: string, schoolId: string, externalCategoryId: string) {
    const pipeline = await this.prisma.externalCategorySchoolPipelineRequest.findUnique({
      where: {
        externalAdminId_externalCategoryId_schoolId: {
          externalAdminId,
          externalCategoryId,
          schoolId,
        },
      },
    });
    if (!pipeline || pipeline.status !== 'approved') {
      throw new ForbiddenException('School pipeline must be approved first.');
    }
    const school = await this.prisma.school.findFirst({
      where: { id: schoolId, isActive: true },
      select: { id: true },
    });
    if (!school) throw new BadRequestException('School not found.');
    return this.prisma.subCategory.findMany({
      where: { category: { schoolId } },
      select: { id: true, name: true, category: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createLink(externalAdminId: string, externalCategoryId: string, subCategoryId: string) {
    const link = await this.prisma.externalAdminCategory.findFirst({
      where: { externalAdminId, externalCategoryId },
      include: { externalCategory: true },
    });
    if (!link?.externalCategory.isActive) {
      throw new ForbiddenException('No access to this category.');
    }
    const sub = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      include: { category: true },
    });
    if (!sub) throw new BadRequestException('Subcategory not found.');
    const pipeline = await this.prisma.externalCategorySchoolPipelineRequest.findUnique({
      where: {
        externalAdminId_externalCategoryId_schoolId: {
          externalAdminId,
          externalCategoryId,
          schoolId: sub.category.schoolId,
        },
      },
    });
    if (!pipeline || pipeline.status !== 'approved') {
      throw new ForbiddenException('School pipeline must be approved for this subcategory.');
    }
    return this.prisma.externalCategorySubcategoryLinkRequest.upsert({
      where: {
        externalAdminId_externalCategoryId_subCategoryId: {
          externalAdminId,
          externalCategoryId,
          subCategoryId,
        },
      },
      create: {
        externalAdminId,
        externalCategoryId,
        subCategoryId,
        schoolId: sub.category.schoolId,
        status: 'pending',
      },
      update: {
        status: 'pending',
        subcategoryAdminMessage: null,
        reviewedAt: null,
        reviewedBySubCategoryAdminId: null,
      },
      include: {
        subCategory: { select: { id: true, name: true } },
        externalCategory: { select: { id: true, name: true } },
      },
    });
  }
}
