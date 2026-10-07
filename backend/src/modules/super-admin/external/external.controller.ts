import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { ExternalService } from './external.service';
import { CreateExternalCategoryDto } from './dto/create-external-category.dto';
import { UpdateExternalCategoryDto } from './dto/update-external-category.dto';
import { CreateExternalAdminDto } from './dto/create-external-admin.dto';
import { UpdateExternalAdminDto } from './dto/update-external-admin.dto';

@Controller('super-admin/external')
@UseGuards(SuperAdminGuard)
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Get('categories')
  listCategories() {
    return this.externalService.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateExternalCategoryDto) {
    return this.externalService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateExternalCategoryDto) {
    return this.externalService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.externalService.deleteCategory(id);
  }

  @Get('admins')
  listAdmins() {
    return this.externalService.listAdmins();
  }

  @Post('admins')
  createAdmin(@Body() dto: CreateExternalAdminDto) {
    return this.externalService.createAdmin(dto);
  }

  @Patch('admins/:id')
  updateAdmin(@Param('id') id: string, @Body() dto: UpdateExternalAdminDto) {
    if (dto.isActive === undefined && dto.categoryIds === undefined) {
      throw new BadRequestException('Provide isActive or categoryIds to update.');
    }
    return this.externalService.updateAdmin(id, dto);
  }

  @Delete('admins/:id')
  deleteAdmin(@Param('id') id: string) {
    return this.externalService.deleteAdmin(id);
  }
}
