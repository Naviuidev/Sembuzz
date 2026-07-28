import { Module } from '@nestjs/common';
import { UserAuthModule } from './auth/auth.module';
import { UserEventsModule } from './events/user-events.module';
import { UserHelpModule } from './help/user-help.module';
import { UserSchoolSocialModule } from './school-social/user-school-social.module';
import { UserNotificationsModule } from './notifications/user-notifications.module';
import { UserClubGroupChatsModule } from './club-group-chats/user-club-group-chats.module';
import { UserDirectChatsModule } from './direct-chats/user-direct-chats.module';
import { UserStudentChatGroupsModule } from './student-chat-groups/user-student-chat-groups.module';

@Module({
  imports: [
    UserAuthModule,
    UserEventsModule,
    UserHelpModule,
    UserSchoolSocialModule,
    UserNotificationsModule,
    UserClubGroupChatsModule,
    UserDirectChatsModule,
    UserStudentChatGroupsModule,
  ],
})
export class UserModule {}
