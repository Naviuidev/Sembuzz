import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { CategoryAdminCategoriesService } from './categories.service';
import { CategoryAdminGuard } from '../guards/category-admin.guard';

@Controller('category-admin/categories')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminCategoriesController {
  constructor(private readonly categoriesService: CategoryAdminCategoriesService) {}

  @Get('my-categories')
  async getMyCategories(@Request() req) {
    const categoryAdminId = req.user.sub;
    return this.categoriesService.getMyCategories(categoryAdminId);
  }

  @Get('my-category')
  async getMyCategory(@Request() req) {
    const categoryId = req.user.categoryId;
    const categoryAdminId = req.user.sub;
    return this.categoriesService.getMyCategory(categoryId, categoryAdminId);
  }
}
