import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClubGroupChatDeleteRequestsService } from './club-group-chat-delete-requests.service';

@Module({
  imports: [PrismaModule],
  providers: [ClubGroupChatDeleteRequestsService],
  exports: [ClubGroupChatDeleteRequestsService],
})
export class ClubGroupChatDeleteRequestsModule {}
