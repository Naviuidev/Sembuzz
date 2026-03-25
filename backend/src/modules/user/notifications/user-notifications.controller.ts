import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { UserGuard } from '../guards/user.guard';
import { UserNotificationsService } from './user-notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UpdateNotificationSubcategoriesDto } from './dto/update-notification-subcategories.dto';

@Controller('user/notifications')
export class UserNotificationsController {
  constructor(private readonly notifications: UserNotificationsService) {}

  @Post('push-token')
  @UseGuards(UserGuard)
  async registerPushToken(
    @Request() req: { user: { sub: string } },
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.notifications.registerPushToken(req.user.sub, dto.token, dto.platform);
  }

  @Delete('push-token')
  @UseGuards(UserGuard)
  async removePushToken(
    @Request() req: { user: { sub: string } },
    @Query('token') token: string | undefined,
  ) {
    if (!token?.trim()) return { ok: false };
    return this.notifications.removePushToken(req.user.sub, token.trim());
  }

  @Get('subcategories')
  @UseGuards(UserGuard)
  async getSubcategories(@Request() req: { user: { sub: string } }) {
    return this.notifications.getNotificationSubcategories(req.user.sub);
  }

  @Put('subcategories')
  @UseGuards(UserGuard)
  async setSubcategories(
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateNotificationSubcategoriesDto,
  ) {
    return this.notifications.setNotificationSubcategories(req.user.sub, dto.subCategoryIds ?? []);
  }

  @Get('inbox')
  @UseGuards(UserGuard)
  async getInbox(@Request() req: { user: { sub: string } }) {
    return this.notifications.getInbox(req.user.sub);
  }

  @Get('unread-count')
  @UseGuards(UserGuard)
  async getUnreadCount(@Request() req: { user: { sub: string } }) {
    return this.notifications.getUnreadCount(req.user.sub);
  }

  @Put('read-all')
  @UseGuards(UserGuard)
  async markAllRead(@Request() req: { user: { sub: string } }) {
    return this.notifications.markAllRead(req.user.sub);
  }

  @Put(':id/read')
  @UseGuards(UserGuard)
  async markRead(
    @Request() req: { user: { sub: string } },
    @Param('id') idFromParam: string | undefined,
  ) {
    const id = idFromParam?.trim();
    if (!id) return { ok: false };
    return this.notifications.markRead(req.user.sub, id);
  }
}
