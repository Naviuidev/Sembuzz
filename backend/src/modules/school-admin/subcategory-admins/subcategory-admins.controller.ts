import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { SchoolAdminSubcategoryAdminsService } from './subcategory-admins.service';
import { SchoolAdminGuard } from '../guards/school-admin.guard';

@Controller('school-admin/subcategory-admins')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminSubcategoryAdminsController {
  constructor(private readonly service: SchoolAdminSubcategoryAdminsService) {}

  @Get()
  async findAll(@Request() req: { user: { schoolId: string } }) {
    return this.service.findAll(req.user.schoolId);
  }

  @Post(':id/ban')
  async ban(@Param('id') id: string, @Request() req: { user: { schoolId: string } }) {
    return this.service.ban(id, req.user.schoolId);
  }

  @Post(':id/unban')
  async unban(@Param('id') id: string, @Request() req: { user: { schoolId: string } }) {
    return this.service.unban(id, req.user.schoolId);
  }
}
