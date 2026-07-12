import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import { ClubGroupChatRequestsService } from '../../club-group-chat-requests/club-group-chat-requests.service';
import { DeclineClubGroupChatRequestDto } from '../../club-group-chat-requests/dto/decline-club-group-chat-request.dto';
import type { ClubGroupChatRequestStatus } from '../../club-group-chat-requests/club-group-chat-requests.util';

@Controller('category-admin/club-group-chat-requests')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminClubGroupChatRequestsController {
  constructor(private readonly service: ClubGroupChatRequestsService) {}

  @Get()
  async list(
    @Request() req: { user: { schoolId: string } },
    @Query('status') status?: ClubGroupChatRequestStatus,
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
    @Body() dto: DeclineClubGroupChatRequestDto,
  ) {
    return this.service.decline(id, req.user.schoolId, 'category_admin', req.user.sub, dto);
  }
}
