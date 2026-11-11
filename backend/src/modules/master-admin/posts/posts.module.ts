import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { MasterAdminPostsController } from './posts.controller';
import { MasterAdminPostsService } from './posts.service';
import { PushNotificationModule } from '../../push/push-notification.module';

@Module({
  imports: [PrismaModule, MasterAdminAuthModule, PushNotificationModule],
  controllers: [MasterAdminPostsController],
  providers: [MasterAdminPostsService],
})
export class MasterAdminPostsModule {}
