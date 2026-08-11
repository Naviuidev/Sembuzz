import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { StudentChatGroupDeleteRequestsModule } from '../../student-chat-group-delete-requests/student-chat-group-delete-requests.module';
import { SchoolAdminStudentChatGroupDeleteRequestsController } from './school-admin-student-chat-group-delete-requests.controller';

@Module({
  imports: [
    ConfigModule,
    StudentChatGroupDeleteRequestsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminStudentChatGroupDeleteRequestsController],
})
export class SchoolAdminStudentChatGroupDeleteRequestsModule {}
