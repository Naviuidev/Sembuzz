import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CategoryAdminAuthModule } from '../auth/auth.module';
import { CategoryAdminBannerAdsController } from './banner-ads.controller';
import { CategoryAdminBannerAdsService } from './banner-ads.service';

@Module({
  imports: [PrismaModule, MulterModule.register({}), CategoryAdminAuthModule],
  controllers: [CategoryAdminBannerAdsController],
  providers: [CategoryAdminBannerAdsService],
  exports: [CategoryAdminBannerAdsService],
})
export class CategoryAdminBannerAdsModule {}
