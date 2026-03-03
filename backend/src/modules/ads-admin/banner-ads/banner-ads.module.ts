import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdsAdminAuthModule } from '../auth/auth.module';
import { AdsAdminBannerAdsController } from './banner-ads.controller';
import { AdsAdminBannerAdsService } from './banner-ads.service';

@Module({
  imports: [PrismaModule, AdsAdminAuthModule],
  controllers: [AdsAdminBannerAdsController],
  providers: [AdsAdminBannerAdsService],
  exports: [AdsAdminBannerAdsService],
})
export class AdsAdminBannerAdsModule {}
