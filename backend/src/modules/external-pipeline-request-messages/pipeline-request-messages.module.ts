import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PipelineRequestMessagesService } from './pipeline-request-messages.service';

@Module({
  imports: [PrismaModule],
  providers: [PipelineRequestMessagesService],
  exports: [PipelineRequestMessagesService],
})
export class PipelineRequestMessagesModule {}
