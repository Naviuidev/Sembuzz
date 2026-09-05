import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PushNotificationModule } from '../../push/push-notification.module';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { SchoolAdminPostsController } from './posts.controller';
import { SchoolAdminPostsService } from './posts.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PushNotificationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminPostsController],
  providers: [SchoolAdminPostsService, SchoolAdminGuard],
  exports: [SchoolAdminPostsService],
})
export class SchoolAdminPostsModule {}
