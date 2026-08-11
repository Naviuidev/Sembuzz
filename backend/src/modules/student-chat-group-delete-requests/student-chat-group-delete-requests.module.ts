import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StudentChatGroupDeleteRequestsService } from './student-chat-group-delete-requests.service';

@Module({
  imports: [PrismaModule],
  providers: [StudentChatGroupDeleteRequestsService],
  exports: [StudentChatGroupDeleteRequestsService],
})
export class StudentChatGroupDeleteRequestsModule {}
