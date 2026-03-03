import { Module } from '@nestjs/common';
import { AdsAdminAuthModule } from './auth/auth.module';
import { AdsAdminBannerAdsModule } from './banner-ads/banner-ads.module';
import { AdsAdminSponsoredAdsModule } from './sponsored-ads/sponsored-ads.module';

@Module({
  imports: [
    AdsAdminAuthModule,
    AdsAdminBannerAdsModule,
    AdsAdminSponsoredAdsModule,
  ],
  exports: [
    AdsAdminAuthModule,
    AdsAdminBannerAdsModule,
    AdsAdminSponsoredAdsModule,
  ],
})
export class AdsAdminModule {}
