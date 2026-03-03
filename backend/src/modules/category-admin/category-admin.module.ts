import { Module } from '@nestjs/common';
import { CategoryAdminAuthModule } from './auth/auth.module';
import { CategoryAdminBannerAdsModule } from './banner-ads/banner-ads.module';
import { CategoryAdminSponsoredAdsModule } from './sponsored-ads/sponsored-ads.module';
import { CategoryAdminCategoriesModule } from './categories/categories.module';
import { CategoryAdminEventsModule } from './events/events.module';
import { CategoryAdminQueriesModule } from './queries/queries.module';
import { SubCategoryAdminsModule } from './subcategory-admins/subcategory-admins.module';

@Module({
  imports: [
    CategoryAdminAuthModule,
    CategoryAdminBannerAdsModule,
    CategoryAdminSponsoredAdsModule,
    CategoryAdminCategoriesModule,
    CategoryAdminEventsModule,
    CategoryAdminQueriesModule,
    SubCategoryAdminsModule,
  ],
  exports: [
    CategoryAdminAuthModule,
    CategoryAdminBannerAdsModule,
    CategoryAdminSponsoredAdsModule,
    CategoryAdminCategoriesModule,
    CategoryAdminEventsModule,
    CategoryAdminQueriesModule,
    SubCategoryAdminsModule,
  ],
})
export class CategoryAdminModule {}
