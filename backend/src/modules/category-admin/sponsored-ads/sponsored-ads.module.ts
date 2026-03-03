import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CategoryAdminAuthModule } from '../auth/auth.module';
import { CategoryAdminSponsoredAdsController } from './sponsored-ads.controller';
import { CategoryAdminSponsoredAdsService } from './sponsored-ads.service';

@Module({
  imports: [PrismaModule, MulterModule.register({}), CategoryAdminAuthModule],
  controllers: [CategoryAdminSponsoredAdsController],
  providers: [CategoryAdminSponsoredAdsService],
  exports: [CategoryAdminSponsoredAdsService],
})
export class CategoryAdminSponsoredAdsModule {}
