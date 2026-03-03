import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UserAuthModule } from '../auth/auth.module';
import { UserHelpController } from './user-help.controller';
import { UserHelpService } from './user-help.service';

@Module({
  imports: [PrismaModule, UserAuthModule],
  controllers: [UserHelpController],
  providers: [UserHelpService],
  exports: [UserHelpService],
})
export class UserHelpModule {}
