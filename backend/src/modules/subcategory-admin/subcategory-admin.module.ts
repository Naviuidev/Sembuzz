import { Module } from '@nestjs/common';
import { SubCategoryAdminAuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SubCategoryAdminQueriesModule } from './queries/queries.module';
import { SubCategoryAdminBlogsModule } from './blogs/blogs.module';
import { SubCategoryAdminClubGroupChatRequestsModule } from './club-group-chat-requests/subcategory-admin-club-group-chat-requests.module';
import { SubCategoryAdminClubGroupMembershipsModule } from './club-group-memberships/subcategory-admin-club-group-memberships.module';
import { SubCategoryAdminClubGroupChatsModule } from './club-group-chats/subcategory-admin-club-group-chats.module';
import { SubCategoryAdminDirectChatsModule } from './direct-chats/subcategory-admin-direct-chats.module';
import { SubCategoryAdminStudentChatGroupsModule } from './student-chat-groups/subcategory-admin-student-chat-groups.module';
import { SubCategoryAdminStudentChatGroupRequestsModule } from './student-chat-group-requests/subcategory-admin-student-chat-group-requests.module';
import { SubCategoryAdminClubGroupChatDeleteRequestsModule } from './club-group-chat-delete-requests/subcategory-admin-club-group-chat-delete-requests.module';
import { SubCategoryAdminStudentChatGroupDeleteRequestsModule } from './student-chat-group-delete-requests/subcategory-admin-student-chat-group-delete-requests.module';

@Module({
  imports: [
    SubCategoryAdminAuthModule,
    EventsModule,
    SubCategoryAdminQueriesModule,
    SubCategoryAdminBlogsModule,
    SubCategoryAdminClubGroupChatRequestsModule,
    SubCategoryAdminClubGroupMembershipsModule,
    SubCategoryAdminClubGroupChatsModule,
    SubCategoryAdminDirectChatsModule,
    SubCategoryAdminStudentChatGroupsModule,
    SubCategoryAdminStudentChatGroupRequestsModule,
    SubCategoryAdminClubGroupChatDeleteRequestsModule,
    SubCategoryAdminStudentChatGroupDeleteRequestsModule,
  ],
  exports: [SubCategoryAdminAuthModule],
})
export class SubCategoryAdminModule {}
