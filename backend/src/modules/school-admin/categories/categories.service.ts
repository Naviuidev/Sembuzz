import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateSubCategoryDto } from '../dto/create-subcategory.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { UpdateSubCategoryDto } from '../dto/update-subcategory.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string) {
    return this.prisma.category.findMany({
      where: { schoolId },
      include: {
        subcategories: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, schoolId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, schoolId },
      include: {
        subcategories: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async create(schoolId: string, createCategoryDto: CreateCategoryDto) {
    const { name, subcategories } = createCategoryDto;

    // Check if category with same name already exists for this school (case-insensitive)
    const existing = await this.prisma.category.findFirst({
      where: {
        schoolId,
        name: {
          equals: name,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Category with name "${name}" already exists`);
    }

    // Create category with optional subcategories
    return this.prisma.category.create({
      data: {
        schoolId,
        name,
        subcategories: subcategories && subcategories.length > 0
          ? {
              create: subcategories.map((subName) => ({ name: subName })),
            }
          : undefined,
      },
      include: {
        subcategories: true,
      },
    });
  }

  async update(id: string, schoolId: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id, schoolId);

    // Check if new name conflicts with existing category
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          schoolId,
          name: {
            equals: updateCategoryDto.name,
          },
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(`Category with name "${updateCategoryDto.name}" already exists`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        subcategories: true,
      },
    });
  }

  async remove(id: string, schoolId: string) {
    const category = await this.findOne(id, schoolId);
    return this.prisma.category.delete({
      where: { id },
    });
  }

  // SubCategory methods
  async createSubCategory(schoolId: string, createSubCategoryDto: CreateSubCategoryDto) {
    const { name, categoryId } = createSubCategoryDto;

    // Verify category belongs to school
    const category = await this.findOne(categoryId, schoolId);

    // Check if subcategory with same name already exists in this category (case-insensitive)
    const existing = await this.prisma.subCategory.findFirst({
      where: {
        categoryId,
        name: {
          equals: name,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`SubCategory with name "${name}" already exists in this category`);
    }

    return this.prisma.subCategory.create({
      data: {
        categoryId,
        name,
      },
    });
  }

  async updateSubCategory(id: string, schoolId: string, updateSubCategoryDto: UpdateSubCategoryDto) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!subCategory) {
      throw new NotFoundException(`SubCategory with id ${id} not found`);
    }

    // Verify category belongs to school
    if (subCategory.category.schoolId !== schoolId) {
      throw new NotFoundException(`SubCategory with id ${id} not found`);
    }

    // Check if new name conflicts with existing subcategory in same category
    if (updateSubCategoryDto.name && updateSubCategoryDto.name !== subCategory.name) {
      const existing = await this.prisma.subCategory.findFirst({
        where: {
          categoryId: subCategory.categoryId,
          name: {
            equals: updateSubCategoryDto.name,
          },
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(`SubCategory with name "${updateSubCategoryDto.name}" already exists in this category`);
      }
    }

    return this.prisma.subCategory.update({
      where: { id },
      data: updateSubCategoryDto,
    });
  }

  async removeSubCategory(id: string, schoolId: string) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!subCategory) {
      throw new NotFoundException(`SubCategory with id ${id} not found`);
    }

    // Verify category belongs to school
    if (subCategory.category.schoolId !== schoolId) {
      throw new NotFoundException(`SubCategory with id ${id} not found`);
    }

    return this.prisma.subCategory.delete({
      where: { id },
    });
  }
}
