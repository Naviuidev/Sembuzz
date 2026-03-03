import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SchoolAdminSocialAccountsController } from './school-admin-social-accounts.controller';
import { SchoolAdminSocialAccountsService } from './school-admin-social-accounts.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MulterModule.register({}),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminSocialAccountsController],
  providers: [SchoolAdminSocialAccountsService],
  exports: [SchoolAdminSocialAccountsService],
})
export class SchoolAdminSocialAccountsModule {}
