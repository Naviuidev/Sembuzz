import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UserAuthModule } from '../auth/auth.module';
import { EventCommentController } from './event-comment.controller';
import { UserEventsController } from './user-events.controller';
import { UserEventsService } from './user-events.service';

@Module({
  imports: [PrismaModule, UserAuthModule],
  controllers: [UserEventsController, EventCommentController],
  providers: [UserEventsService],
  exports: [UserEventsService],
})
export class UserEventsModule {}
