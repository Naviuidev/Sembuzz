import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { SchoolAdminClubGroupChatsService } from './school-admin-club-group-chats.service';
import { UpsertClubGroupChatDto } from './dto/upsert-club-group-chat.dto';
import { UpdateClubGroupMessageModeDto } from './dto/update-message-mode.dto';

@Controller('school-admin/club-group-chats')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminClubGroupChatsController {
  constructor(private readonly service: SchoolAdminClubGroupChatsService) {}

  @Get()
  async list(@Request() req: { user: { schoolId: string } }) {
    return this.service.listForSchool(req.user.schoolId);
  }

  @Get('by-club/:clubKey')
  async findByClubKey(
    @Request() req: { user: { schoolId: string } },
    @Param('clubKey') clubKey: string,
  ) {
    return this.service.findByClubKey(req.user.schoolId, decodeURIComponent(clubKey));
  }

  @Post()
  async upsert(
    @Request() req: { user: { schoolId: string } },
    @Body() dto: UpsertClubGroupChatDto,
  ) {
    return this.service.upsert(req.user.schoolId, dto);
  }

  @Patch(':id/message-mode')
  async updateMessageMode(
    @Request() req: { user: { schoolId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateClubGroupMessageModeDto,
  ) {
    return this.service.updateMessageMode(id, req.user.schoolId, dto.messageMode);
  }
}
