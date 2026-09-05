import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';
import { PushNotificationModule } from '../push/push-notification.module';
import { ScheduledPublishService } from './scheduled-publish.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, PushNotificationModule],
  providers: [ScheduledPublishService],
  exports: [ScheduledPublishService],
})
export class EventsPublishingModule {}
