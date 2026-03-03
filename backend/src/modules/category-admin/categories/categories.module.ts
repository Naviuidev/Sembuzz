import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { CategoryAdminCategoriesController } from './categories.controller';
import { CategoryAdminCategoriesService } from './categories.service';
import { CategoryAdminGuard } from '../guards/category-admin.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [CategoryAdminCategoriesController],
  providers: [CategoryAdminCategoriesService, CategoryAdminGuard],
  exports: [CategoryAdminCategoriesService],
})
export class CategoryAdminCategoriesModule {}
