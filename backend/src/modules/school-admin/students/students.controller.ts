import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { SchoolAdminStudentsService } from './students.service';
import { SchoolAdminGuard } from '../guards/school-admin.guard';

@Controller('school-admin/students')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminStudentsController {
  constructor(private readonly studentsService: SchoolAdminStudentsService) {}

  @Get('approved')
  async listApproved(@Request() req: { user: { schoolId: string } }) {
    return this.studentsService.findApprovedForSchool(req.user.schoolId);
  }

  @Get('automated')
  async listAutomated(@Request() req: { user: { schoolId: string } }) {
    return this.studentsService.findAutomatedForSchool(req.user.schoolId);
  }

  @Post(':id/ban')
  async ban(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string } },
  ) {
    return this.studentsService.ban(id, req.user.schoolId);
  }

  @Post(':id/unban')
  async unban(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string } },
  ) {
    return this.studentsService.unban(id, req.user.schoolId);
  }
}
