import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { SchoolAdminGuard } from '../school-admin/guards/school-admin.guard';
import { CategoryAdminGuard } from '../category-admin/guards/category-admin.guard';
import { SubCategoryAdminGuard } from '../subcategory-admin/guards/subcategory-admin.guard';
import { SuperAdminGuard } from '../super-admin/guards/super-admin.guard';
import { AdsAdminGuard } from '../ads-admin/guards/ads-admin.guard';
import { AdminActionItemsService } from './admin-action-items.service';
import {
  AdsAdminActionItemsController,
  CategoryAdminActionItemsController,
  SchoolAdminActionItemsController,
  SubCategoryAdminActionItemsController,
  SuperAdminActionItemsController,
} from './admin-action-items.controllers';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    SchoolAdminActionItemsController,
    CategoryAdminActionItemsController,
    SubCategoryAdminActionItemsController,
    SuperAdminActionItemsController,
    AdsAdminActionItemsController,
  ],
  providers: [
    AdminActionItemsService,
    SchoolAdminGuard,
    CategoryAdminGuard,
    SubCategoryAdminGuard,
    SuperAdminGuard,
    AdsAdminGuard,
  ],
})
export class AdminActionItemsModule {}
