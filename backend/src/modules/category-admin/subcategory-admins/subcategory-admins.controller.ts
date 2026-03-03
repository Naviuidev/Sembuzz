import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubCategoryAdminsService } from './subcategory-admins.service';
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import { CreateSubCategoryAdminDto } from '../dto/create-subcategory-admin.dto';
import { UpdateSubCategoryAdminSubCategoriesDto } from '../dto/update-subcategory-admin-subcategories.dto';

@Controller('category-admin/subcategory-admins')
@UseGuards(CategoryAdminGuard)
export class SubCategoryAdminsController {
  constructor(private readonly subCategoryAdminsService: SubCategoryAdminsService) {}

  @Get()
  async findAll(@Request() req) {
    const categoryId = req.user.categoryId;
    const categoryAdminId = req.user.sub;
    return this.subCategoryAdminsService.findAll(categoryId, categoryAdminId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const categoryId = req.user.categoryId;
    const categoryAdminId = req.user.sub;
    return this.subCategoryAdminsService.findOne(id, categoryId, categoryAdminId);
  }

  @Post()
  async create(@Body() createSubCategoryAdminDto: CreateSubCategoryAdminDto, @Request() req) {
    const categoryId = req.user.categoryId;
    const categoryAdminId = req.user.sub;
    return this.subCategoryAdminsService.create(categoryId, categoryAdminId, createSubCategoryAdminDto);
  }

  @Put(':id/subcategories')
  async updateSubCategories(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubCategoryAdminSubCategoriesDto,
    @Request() req,
  ) {
    const categoryId = req.user.categoryId;
    const categoryAdminId = req.user.sub;
    return this.subCategoryAdminsService.updateSubCategories(id, categoryId, categoryAdminId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const categoryId = req.user.categoryId;
    const categoryAdminId = req.user.sub;
    return this.subCategoryAdminsService.remove(id, categoryId, categoryAdminId);
  }
}
