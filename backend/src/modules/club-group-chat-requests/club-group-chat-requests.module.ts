import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClubGroupChatRequestsService } from './club-group-chat-requests.service';

@Module({
  imports: [PrismaModule],
  providers: [ClubGroupChatRequestsService],
  exports: [ClubGroupChatRequestsService],
})
export class ClubGroupChatRequestsModule {}
