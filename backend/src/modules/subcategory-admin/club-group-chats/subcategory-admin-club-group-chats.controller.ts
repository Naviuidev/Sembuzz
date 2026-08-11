import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { SubCategoryAdminClubGroupChatsService } from './subcategory-admin-club-group-chats.service';
import { SubCategoryAdminSendClubGroupMessageDto } from './dto/send-club-group-message.dto';

@Controller('subcategory-admin/club-group-chats')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminClubGroupChatsController {
  constructor(private readonly service: SubCategoryAdminClubGroupChatsService) {}

  @Get()
  async list(@Request() req: { user: { schoolId: string } }) {
    return this.service.listForSchool(req.user.schoolId);
  }

  @Get(':id/approved-members')
  async listApprovedMembers(
    @Request() req: { user: { schoolId: string } },
    @Param('id') id: string,
  ) {
    return this.service.listApprovedMembers(id, req.user.schoolId);
  }

  @Get(':id/messages')
  async listMessages(
    @Request() req: { user: { schoolId: string } },
    @Param('id') id: string,
  ) {
    return this.service.listMessages(id, req.user.schoolId);
  }

  @Post(':id/messages')
  async sendMessage(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Param('id') id: string,
    @Body() dto: SubCategoryAdminSendClubGroupMessageDto,
  ) {
    return this.service.sendMessage(id, req.user.schoolId, req.user.sub, dto);
  }
}
