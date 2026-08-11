import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import { StudentChatGroupRequestsService } from '../../student-chat-group-requests/student-chat-group-requests.service';
import { DeclineStudentChatGroupRequestDto } from '../../student-chat-group-requests/dto/decline-student-chat-group-request.dto';
import type { StudentChatGroupRequestStatus } from '../../student-chat-group-requests/student-chat-group-requests.util';

@Controller('category-admin/student-chat-group-requests')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminStudentChatGroupRequestsController {
  constructor(private readonly service: StudentChatGroupRequestsService) {}

  @Get()
  async list(
    @Request() req: { user: { schoolId: string } },
    @Query('status') status?: StudentChatGroupRequestStatus,
  ) {
    return this.service.listForSchoolReview(req.user.schoolId, status);
  }

  @Post(':id/approve')
  async approve(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
  ) {
    return this.service.approve(id, req.user.schoolId, 'category_admin', req.user.sub);
  }

  @Post(':id/decline')
  async decline(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: DeclineStudentChatGroupRequestDto,
  ) {
    return this.service.decline(id, req.user.schoolId, 'category_admin', req.user.sub, dto);
  }
}
