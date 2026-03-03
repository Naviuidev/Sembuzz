import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UserAuthModule } from '../auth/auth.module';
import { UserSchoolSocialController } from './user-school-social.controller';

@Module({
  imports: [PrismaModule, UserAuthModule],
  controllers: [UserSchoolSocialController],
})
export class UserSchoolSocialModule {}
