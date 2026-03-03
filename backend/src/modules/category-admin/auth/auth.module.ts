import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { CategoryAdminAuthController } from './auth.controller';
import { CategoryAdminAuthService } from './auth.service';
import { CategoryAdminGuard } from '../guards/category-admin.guard';

@Module({
  imports: [
    ConfigModule,
    SchoolsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [CategoryAdminAuthController],
  providers: [CategoryAdminAuthService, CategoryAdminGuard],
  exports: [CategoryAdminAuthService, CategoryAdminGuard, JwtModule],
})
export class CategoryAdminAuthModule {}
