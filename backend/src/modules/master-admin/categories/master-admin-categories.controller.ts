import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MasterAdminGuard } from '../guards/master-admin.guard';
import { CreateMasterAdminCategoryDto } from './dto/create-master-admin-category.dto';
import { CreateMasterAdminSubCategoryDto } from './dto/create-master-admin-subcategory.dto';
import { MasterAdminCategoriesService } from './master-admin-categories.service';
import { UpdateCategoryDto } from '../../school-admin/dto/update-category.dto';
import { UpdateSubCategoryDto } from '../../school-admin/dto/update-subcategory.dto';

@Controller('master-admin/categories')
@UseGuards(MasterAdminGuard)
export class MasterAdminCategoriesController {
  constructor(private readonly categoriesService: MasterAdminCategoriesService) {}

  @Get()
  findAll(@Query('schoolId') schoolId: string) {
    return this.categoriesService.findAll(schoolId);
  }

  @Post('subcategories')
  createSubCategory(@Body() dto: CreateMasterAdminSubCategoryDto) {
    const { schoolId, ...rest } = dto;
    return this.categoriesService.createSubCategory(schoolId, rest);
  }

  @Put('subcategories/:id')
  updateSubCategory(
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: UpdateSubCategoryDto,
  ) {
    return this.categoriesService.updateSubCategory(schoolId, id, dto);
  }

  @Delete('subcategories/:id')
  removeSubCategory(@Param('id') id: string, @Query('schoolId') schoolId: string) {
    return this.categoriesService.removeSubCategory(schoolId, id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('schoolId') schoolId: string) {
    return this.categoriesService.findOne(schoolId, id);
  }

  @Post()
  create(@Body() dto: CreateMasterAdminCategoryDto) {
    const { schoolId, ...rest } = dto;
    return this.categoriesService.create(schoolId, rest);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(schoolId, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('schoolId') schoolId: string) {
    return this.categoriesService.remove(schoolId, id);
  }
}
