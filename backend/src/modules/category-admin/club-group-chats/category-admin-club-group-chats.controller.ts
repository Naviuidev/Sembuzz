import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { CategoryAdminGuard } from '../guards/category-admin.guard';
import { CategoryAdminClubGroupChatsService } from './category-admin-club-group-chats.service';
import { UpdateClubGroupMessageModeDto } from './dto/update-message-mode.dto';
import { CategoryAdminSendClubGroupMessageDto } from './dto/send-club-group-message.dto';

@Controller('category-admin/club-group-chats')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminClubGroupChatsController {
  constructor(private readonly service: CategoryAdminClubGroupChatsService) {}

  @Get()
  async list(@Request() req: { user: { schoolId: string } }) {
    return this.service.listForSchool(req.user.schoolId);
  }

  @Patch(':id/message-mode')
  async updateMessageMode(
    @Request() req: { user: { schoolId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateClubGroupMessageModeDto,
  ) {
    return this.service.updateMessageMode(id, req.user.schoolId, dto.messageMode);
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
    @Body() dto: CategoryAdminSendClubGroupMessageDto,
  ) {
    return this.service.sendMessage(id, req.user.schoolId, req.user.sub, dto);
  }
}
