import { Body, Controller, Get, NotFoundException, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';
import { SubCategoryAdminDirectChatsService } from './subcategory-admin-direct-chats.service';
import { UpdateDirectMessagingSettingDto } from './dto/update-direct-messaging-setting.dto';

@Controller('subcategory-admin/direct-chats')
@UseGuards(SubCategoryAdminGuard)
export class SubCategoryAdminDirectChatsController {
  constructor(private readonly service: SubCategoryAdminDirectChatsService) {}

  @Get('settings')
  async getSettings(@Request() req: { user: { schoolId: string } }) {
    return this.service.getSetting(req.user.schoolId);
  }

  @Patch('settings')
  async updateSettings(
    @Request() req: { user: { schoolId: string } },
    @Body() dto: UpdateDirectMessagingSettingDto,
  ) {
    return this.service.updateSetting(req.user.schoolId, dto.isEnabled);
  }

  @Get()
  async list(@Request() req: { user: { schoolId: string } }) {
    return this.service.listConversations(req.user.schoolId);
  }

  @Get(':id/messages')
  async listMessages(
    @Request() req: { user: { schoolId: string } },
    @Param('id') id: string,
  ) {
    const result = await this.service.listMessages(req.user.schoolId, id);
    if (!result) throw new NotFoundException('Conversation not found.');
    return result;
  }
}
