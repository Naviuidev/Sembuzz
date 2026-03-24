import { Module } from '@nestjs/common';
import { UserAuthModule } from './auth/auth.module';
import { UserEventsModule } from './events/user-events.module';
import { UserHelpModule } from './help/user-help.module';
import { UserSchoolSocialModule } from './school-social/user-school-social.module';
import { UserNotificationsModule } from './notifications/user-notifications.module';

@Module({
  imports: [
    UserAuthModule,
    UserEventsModule,
    UserHelpModule,
    UserSchoolSocialModule,
    UserNotificationsModule,
  ],
})
export class UserModule {}
