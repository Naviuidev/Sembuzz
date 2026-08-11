import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { StudentChatGroupRequestsModule } from '../../student-chat-group-requests/student-chat-group-requests.module';
import { CategoryAdminStudentChatGroupRequestsController } from './category-admin-student-chat-group-requests.controller';

@Module({
  imports: [
    ConfigModule,
    StudentChatGroupRequestsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [CategoryAdminStudentChatGroupRequestsController],
})
export class CategoryAdminStudentChatGroupRequestsModule {}
