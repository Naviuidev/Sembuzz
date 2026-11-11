import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CategoriesService } from '../../school-admin/categories/categories.service';
import { CreateCategoryDto } from '../../school-admin/dto/create-category.dto';
import { CreateSubCategoryDto } from '../../school-admin/dto/create-subcategory.dto';
import { UpdateCategoryDto } from '../../school-admin/dto/update-category.dto';
import { UpdateSubCategoryDto } from '../../school-admin/dto/update-subcategory.dto';

@Injectable()
export class MasterAdminCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}

  private async ensureSchool(schoolId: string): Promise<void> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
  }

  async findAll(schoolId: string) {
    await this.ensureSchool(schoolId);
    return this.categories.findAll(schoolId);
  }

  async findOne(schoolId: string, id: string) {
    await this.ensureSchool(schoolId);
    return this.categories.findOne(id, schoolId);
  }

  async create(schoolId: string, dto: CreateCategoryDto) {
    await this.ensureSchool(schoolId);
    return this.categories.create(schoolId, dto);
  }

  async update(schoolId: string, id: string, dto: UpdateCategoryDto) {
    await this.ensureSchool(schoolId);
    return this.categories.update(id, schoolId, dto);
  }

  async remove(schoolId: string, id: string) {
    await this.ensureSchool(schoolId);
    await this.categories.remove(id, schoolId);
    return { message: 'Category deleted successfully' };
  }

  async createSubCategory(schoolId: string, dto: CreateSubCategoryDto) {
    await this.ensureSchool(schoolId);
    return this.categories.createSubCategory(schoolId, dto);
  }

  async updateSubCategory(schoolId: string, id: string, dto: UpdateSubCategoryDto) {
    await this.ensureSchool(schoolId);
    return this.categories.updateSubCategory(id, schoolId, dto);
  }

  async removeSubCategory(schoolId: string, id: string) {
    await this.ensureSchool(schoolId);
    await this.categories.removeSubCategory(id, schoolId);
    return { message: 'SubCategory deleted successfully' };
  }
}
