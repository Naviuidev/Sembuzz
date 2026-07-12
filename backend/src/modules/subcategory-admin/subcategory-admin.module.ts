import { Module } from '@nestjs/common';
import { SubCategoryAdminAuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SubCategoryAdminQueriesModule } from './queries/queries.module';
import { SubCategoryAdminBlogsModule } from './blogs/blogs.module';
import { SubCategoryAdminClubGroupChatRequestsModule } from './club-group-chat-requests/subcategory-admin-club-group-chat-requests.module';

@Module({
  imports: [
    SubCategoryAdminAuthModule,
    EventsModule,
    SubCategoryAdminQueriesModule,
    SubCategoryAdminBlogsModule,
    SubCategoryAdminClubGroupChatRequestsModule,
  ],
  exports: [SubCategoryAdminAuthModule],
})
export class SubCategoryAdminModule {}
