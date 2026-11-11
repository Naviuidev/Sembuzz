import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MasterAdminGuard } from '../guards/master-admin.guard';
import { PlatformMasterAdminGuard } from '../guards/platform-master-admin.guard';
import { MasterAdminAuthController } from './auth.controller';
import { MasterAdminAuthService } from './auth.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [MasterAdminAuthController],
  providers: [MasterAdminAuthService, MasterAdminGuard, PlatformMasterAdminGuard],
  exports: [MasterAdminAuthService, MasterAdminGuard, PlatformMasterAdminGuard, JwtModule],
})
export class MasterAdminAuthModule {}
