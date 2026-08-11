import { Controller, Get, Param, Post, Query, Request, UseGuards, Body } from '@nestjs/common';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { SubCategoryAdminStudentChatGroupsService } from './subcategory-admin-student-chat-groups.service';
import { AddStudentChatGroupMemberDto } from '../../user/student-chat-groups/dto/add-student-chat-group-member.dto';

@Controller('subcategory-admin/student-chat-groups')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminStudentChatGroupsController {
  constructor(private readonly service: SubCategoryAdminStudentChatGroupsService) {}

  @Get()
  async list(@Request() req: { user: { schoolId: string } }) {
    return this.service.listForSchool(req.user.schoolId);
  }

  @Get('students')
  async searchStudents(
    @Request() req: { user: { schoolId: string } },
    @Query('q') q?: string,
  ) {
    return this.service.searchStudents(req.user.schoolId, q);
  }

  @Get(':id/members')
  async members(
    @Request() req: { user: { schoolId: string } },
    @Param('id') id: string,
  ) {
    return this.service.listMembers(id, req.user.schoolId);
  }

  @Post(':id/members')
  async addMember(
    @Request() req: { user: { schoolId: string } },
    @Param('id') id: string,
    @Body() dto: AddStudentChatGroupMemberDto,
  ) {
    return this.service.addMember(id, req.user.schoolId, dto.userId);
  }
}
