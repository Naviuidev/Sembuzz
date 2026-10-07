import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ExternalAdminGuard } from '../guards/external-admin.guard';
import { ExternalAdminCategorySubcategoryLinksService } from './category-subcategory-links.service';

@Controller('external-admin/category-subcategory-links')
@UseGuards(ExternalAdminGuard)
export class ExternalAdminCategorySubcategoryLinksController {
  constructor(private readonly service: ExternalAdminCategorySubcategoryLinksService) {}

  @Get('school-subcategories')
  schoolSubcategories(
    @Request() req: { user: { sub: string } },
    @Query('schoolId') schoolId: string,
    @Query('externalCategoryId') externalCategoryId: string,
  ) {
    return this.service.listSchoolSubcategories(req.user.sub, schoolId, externalCategoryId);
  }

  @Post('requests')
  create(
    @Request() req: { user: { sub: string } },
    @Body() body: { externalCategoryId: string; subCategoryId: string },
  ) {
    return this.service.createLink(req.user.sub, body.externalCategoryId, body.subCategoryId);
  }
}
