import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CategoryAdminAuthModule } from '../auth/auth.module';
import { CategoryAdminEventsController } from './events.controller';
import { CategoryAdminEventsService } from './events.service';
import { PushNotificationModule } from '../../push/push-notification.module';

@Module({
  imports: [PrismaModule, CategoryAdminAuthModule, PushNotificationModule],
  controllers: [CategoryAdminEventsController],
  providers: [CategoryAdminEventsService],
  exports: [CategoryAdminEventsService],
})
export class CategoryAdminEventsModule {}
