import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SchoolAdminAdsAdminsController } from './ads-admins.controller';
import { SchoolAdminAdsAdminsService } from './ads-admins.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminAdsAdminsController],
  providers: [SchoolAdminAdsAdminsService],
  exports: [SchoolAdminAdsAdminsService],
})
export class SchoolAdminAdsAdminsModule {}
