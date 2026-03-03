import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SchoolAdminAuthController } from './auth.controller';
import { SchoolAdminAuthService } from './auth.service';
import { EmailService } from '../../super-admin/schools/email.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminAuthController],
  providers: [SchoolAdminAuthService, EmailService],
  exports: [SchoolAdminAuthService],
})
export class SchoolAdminAuthModule {}
