import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UserStudentChatGroupsController } from './user-student-chat-groups.controller';
import { UserStudentChatGroupsService } from './user-student-chat-groups.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MulterModule.register({}),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [UserStudentChatGroupsController],
  providers: [UserStudentChatGroupsService],
})
export class UserStudentChatGroupsModule {}
