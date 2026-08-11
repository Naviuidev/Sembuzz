import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { SchoolAdminDirectChatsService } from './school-admin-direct-chats.service';
import { UpdateDirectMessagingSettingDto } from './dto/update-direct-messaging-setting.dto';

@Controller('school-admin/direct-chats')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminDirectChatsController {
  constructor(private readonly service: SchoolAdminDirectChatsService) {}

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
}
