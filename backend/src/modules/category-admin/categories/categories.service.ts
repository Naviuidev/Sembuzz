import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CategoryAdminCategoriesService {
  constructor(private prisma: PrismaService) {}

  async getMyCategory(categoryId: string, categoryAdminId: string) {
    // Verify that the category admin has access to this category
    const categoryAdmin = await this.prisma.categoryAdmin.findFirst({
      where: {
        id: categoryAdminId,
        categoryId,
      },
    });

    if (!categoryAdmin) {
      throw new UnauthorizedException('You do not have access to this category');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        subcategories: {
          orderBy: { createdAt: 'asc' },
        },
        school: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /** All categories this category admin has access to (primary + many-to-many). */
  async getMyCategories(categoryAdminId: string) {
    const admin = await this.prisma.categoryAdmin.findFirst({
      where: { id: categoryAdminId },
      select: { categoryId: true },
    });
    if (!admin) {
      throw new UnauthorizedException('User not found');
    }
    const junctionRows = await this.prisma.categoryAdminCategory.findMany({
      where: { categoryAdminId },
      select: { categoryId: true },
    });
    const categoryIds = new Set<string>([admin.categoryId, ...junctionRows.map((r) => r.categoryId)]);
    if (categoryIds.size === 0) {
      return [];
    }
    const categories = await this.prisma.category.findMany({
      where: { id: { in: Array.from(categoryIds) } },
      include: {
        subcategories: { orderBy: { createdAt: 'asc' } },
        school: { select: { id: true, name: true, domain: true } },
      },
      orderBy: { name: 'asc' },
    });
    return categories;
  }
}
