import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { SchoolAdminUserHelpService } from './school-admin-user-help.service';

@Controller('school-admin/user-help')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminUserHelpController {
  constructor(private readonly userHelpService: SchoolAdminUserHelpService) {}

  @Get()
  async list(@Request() req: { user: { schoolId: string } }) {
    return this.userHelpService.findAllForSchool(req.user.schoolId);
  }
}
