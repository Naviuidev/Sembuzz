import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UserAuthModule } from '../auth/auth.module';
import { EventCommentController } from './event-comment.controller';
import { UserExternalFeedController } from './user-external-feed.controller';
import { UserExternalFeedService } from './user-external-feed.service';
import { UserEventsController } from './user-events.controller';
import { UserEventsService } from './user-events.service';

@Module({
  imports: [PrismaModule, UserAuthModule],
  controllers: [UserEventsController, EventCommentController, UserExternalFeedController],
  providers: [UserEventsService, UserExternalFeedService],
  exports: [UserEventsService],
})
export class UserEventsModule {}
