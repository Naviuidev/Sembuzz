import { Module } from '@nestjs/common';
import { CategoryAdminAuthModule } from './auth/auth.module';
import { CategoryAdminBannerAdsModule } from './banner-ads/banner-ads.module';
import { CategoryAdminSponsoredAdsModule } from './sponsored-ads/sponsored-ads.module';
import { CategoryAdminCategoriesModule } from './categories/categories.module';
import { CategoryAdminEventsModule } from './events/events.module';
import { CategoryAdminBlogsModule } from './blogs/category-admin-blogs.module';
import { CategoryAdminQueriesModule } from './queries/queries.module';
import { CategoryAdminClubGroupMembershipsModule } from './club-group-memberships/category-admin-club-group-memberships.module';
import { CategoryAdminClubGroupChatsModule } from './club-group-chats/category-admin-club-group-chats.module';
import { CategoryAdminDirectChatsModule } from './direct-chats/category-admin-direct-chats.module';
import { CategoryAdminClubGroupChatRequestsModule } from './club-group-chat-requests/category-admin-club-group-chat-requests.module';
import { SubCategoryAdminsModule } from './subcategory-admins/subcategory-admins.module';

@Module({
  imports: [
    CategoryAdminAuthModule,
    CategoryAdminBannerAdsModule,
    CategoryAdminSponsoredAdsModule,
    CategoryAdminCategoriesModule,
    CategoryAdminEventsModule,
    CategoryAdminBlogsModule,
    CategoryAdminQueriesModule,
    CategoryAdminClubGroupMembershipsModule,
    CategoryAdminClubGroupChatsModule,
    CategoryAdminDirectChatsModule,
    CategoryAdminClubGroupChatRequestsModule,
    SubCategoryAdminsModule,
  ],
  exports: [
    CategoryAdminAuthModule,
    CategoryAdminBannerAdsModule,
    CategoryAdminSponsoredAdsModule,
    CategoryAdminCategoriesModule,
    CategoryAdminEventsModule,
    CategoryAdminBlogsModule,
    CategoryAdminQueriesModule,
    CategoryAdminClubGroupMembershipsModule,
    CategoryAdminClubGroupChatsModule,
    CategoryAdminDirectChatsModule,
    SubCategoryAdminsModule,
  ],
})
export class CategoryAdminModule {}
