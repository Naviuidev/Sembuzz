import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { StudentChatGroupDeleteRequestsService } from '../../student-chat-group-delete-requests/student-chat-group-delete-requests.service';
import { DeclineMessagingDeleteRequestDto } from '../../student-chat-group-delete-requests/dto/decline-messaging-delete-request.dto';
import type { MessagingDeleteRequestStatus } from '../../student-chat-group-delete-requests/student-chat-group-delete-requests.util';

@Controller('school-admin/student-chat-group-delete-requests')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminStudentChatGroupDeleteRequestsController {
  constructor(private readonly service: StudentChatGroupDeleteRequestsService) {}

  @Get()
  async list(
    @Request() req: { user: { schoolId: string } },
    @Query('status') status?: MessagingDeleteRequestStatus,
  ) {
    return this.service.listForSchoolReview(req.user.schoolId, status);
  }

  @Post(':id/approve')
  async approve(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
  ) {
    return this.service.approve(id, req.user.schoolId, 'school_admin', req.user.sub);
  }

  @Post(':id/decline')
  async decline(
    @Request() req: { user: { sub: string; schoolId: string } },
    @Param('id') id: string,
    @Body() dto: DeclineMessagingDeleteRequestDto,
  ) {
    return this.service.decline(id, req.user.schoolId, 'school_admin', req.user.sub, dto);
  }
}
