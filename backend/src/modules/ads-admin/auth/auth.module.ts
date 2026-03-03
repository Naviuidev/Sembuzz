import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { AdsAdminAuthController } from './auth.controller';
import { AdsAdminAuthService } from './auth.service';
import { AdsAdminGuard } from '../guards/ads-admin.guard';

@Module({
  imports: [
    ConfigModule,
    SchoolsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AdsAdminAuthController],
  providers: [AdsAdminAuthService, AdsAdminGuard],
  exports: [AdsAdminAuthService, AdsAdminGuard, JwtModule],
})
export class AdsAdminAuthModule {}
