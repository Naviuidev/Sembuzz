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
import { CategoriesService } from './categories.service';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateSubCategoryDto } from '../dto/create-subcategory.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { UpdateSubCategoryDto } from '../dto/update-subcategory.dto';

@Controller('school-admin/categories')
@UseGuards(SchoolAdminGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoriesService.findAll(schoolId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoriesService.findOne(id, schoolId);
  }

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoriesService.create(schoolId, createCategoryDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req,
  ) {
    const schoolId = req.user.schoolId;
    return this.categoriesService.update(id, schoolId, updateCategoryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoriesService.remove(id, schoolId);
  }

  // SubCategory endpoints
  @Post('subcategories')
  async createSubCategory(@Body() createSubCategoryDto: CreateSubCategoryDto, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoriesService.createSubCategory(schoolId, createSubCategoryDto);
  }

  @Put('subcategories/:id')
  async updateSubCategory(
    @Param('id') id: string,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
    @Request() req,
  ) {
    const schoolId = req.user.schoolId;
    return this.categoriesService.updateSubCategory(id, schoolId, updateSubCategoryDto);
  }

  @Delete('subcategories/:id')
  async removeSubCategory(@Param('id') id: string, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoriesService.removeSubCategory(id, schoolId);
  }
}
