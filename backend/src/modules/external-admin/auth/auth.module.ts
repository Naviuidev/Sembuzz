import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PlatformUserModule } from '../../platform-user/platform-user.module';
import { ExternalAdminGuard } from '../guards/external-admin.guard';
import { ExternalAdminAuthController } from './auth.controller';
import { ExternalAdminAuthService } from './auth.service';

@Module({
  imports: [
    ConfigModule,
    PlatformUserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ExternalAdminAuthController],
  providers: [ExternalAdminAuthService, ExternalAdminGuard],
  exports: [ExternalAdminAuthService, ExternalAdminGuard, JwtModule],
})
export class ExternalAdminAuthModule {}
