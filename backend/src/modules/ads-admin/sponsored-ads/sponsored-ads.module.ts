import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdsAdminAuthModule } from '../auth/auth.module';
import { AdsAdminSponsoredAdsController } from './sponsored-ads.controller';
import { AdsAdminSponsoredAdsService } from './sponsored-ads.service';

@Module({
  imports: [PrismaModule, AdsAdminAuthModule],
  controllers: [AdsAdminSponsoredAdsController],
  providers: [AdsAdminSponsoredAdsService],
  exports: [AdsAdminSponsoredAdsService],
})
export class AdsAdminSponsoredAdsModule {}
