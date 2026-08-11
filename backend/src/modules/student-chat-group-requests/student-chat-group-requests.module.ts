import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StudentChatGroupRequestsService } from './student-chat-group-requests.service';

@Module({
  imports: [PrismaModule],
  providers: [StudentChatGroupRequestsService],
  exports: [StudentChatGroupRequestsService],
})
export class StudentChatGroupRequestsModule {}
