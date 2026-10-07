import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExternalSchoolPostMessagesService } from './post-request-messages.service';

@Module({
  imports: [PrismaModule],
  providers: [ExternalSchoolPostMessagesService],
  exports: [ExternalSchoolPostMessagesService],
})
export class ExternalSchoolPostMessagesModule {}
