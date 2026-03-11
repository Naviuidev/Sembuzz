import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { SchoolsModule } from '../super-admin/schools/schools.module';

@Module({
  imports: [SchoolsModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
