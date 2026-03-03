import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SchoolAdminUserHelpController } from './school-admin-user-help.controller';
import { SchoolAdminUserHelpService } from './school-admin-user-help.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminUserHelpController],
  providers: [SchoolAdminUserHelpService],
  exports: [SchoolAdminUserHelpService],
})
export class SchoolAdminUserHelpModule {}
