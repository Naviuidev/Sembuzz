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
import { CategoryAdminsService } from './category-admins.service';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { CreateCategoryAdminDto } from '../dto/create-category-admin.dto';
import { UpdateCategoryAdminCategoriesDto } from '../dto/update-category-admin-categories.dto';

@Controller('school-admin/category-admins')
@UseGuards(SchoolAdminGuard)
export class CategoryAdminsController {
  constructor(private readonly categoryAdminsService: CategoryAdminsService) {}

  @Get()
  async findAll(@Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoryAdminsService.findAll(schoolId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoryAdminsService.findOne(id, schoolId);
  }

  @Post()
  async create(@Body() createCategoryAdminDto: CreateCategoryAdminDto, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoryAdminsService.create(schoolId, createCategoryAdminDto);
  }

  @Put(':id/categories')
  async updateCategories(
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryAdminCategoriesDto,
    @Request() req,
  ) {
    const schoolId = req.user.schoolId;
    return this.categoryAdminsService.updateCategories(id, schoolId, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoryAdminsService.remove(id, schoolId);
  }

  @Post(':id/ban')
  async ban(@Param('id') id: string, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoryAdminsService.ban(id, schoolId);
  }

  @Post(':id/unban')
  async unban(@Param('id') id: string, @Request() req) {
    const schoolId = req.user.schoolId;
    return this.categoryAdminsService.unban(id, schoolId);
  }
}
