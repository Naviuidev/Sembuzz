import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { ClubGroupChatDeleteRequestsService } from '../../club-group-chat-delete-requests/club-group-chat-delete-requests.service';
import { DeclineMessagingDeleteRequestDto } from '../../club-group-chat-delete-requests/dto/decline-messaging-delete-request.dto';
import type { MessagingDeleteRequestStatus } from '../../club-group-chat-delete-requests/club-group-chat-delete-requests.util';

@Controller('school-admin/club-group-chat-delete-requests')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminClubGroupChatDeleteRequestsController {
  constructor(private readonly service: ClubGroupChatDeleteRequestsService) {}

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
