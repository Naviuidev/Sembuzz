import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { SubCategoryAdminAuthController } from './auth.controller';
import { SubCategoryAdminAuthService } from './auth.service';
import { SubCategoryAdminGuard } from '../guards/subcategory-admin.guard';

@Module({
  imports: [
    ConfigModule,
    SchoolsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SubCategoryAdminAuthController],
  providers: [SubCategoryAdminAuthService, SubCategoryAdminGuard],
  exports: [
    SubCategoryAdminAuthService,
    SubCategoryAdminGuard,
    JwtModule,
  ],
})
export class SubCategoryAdminAuthModule {}
