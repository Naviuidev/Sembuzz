import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ClubGroupChatDeleteRequestsModule } from '../../club-group-chat-delete-requests/club-group-chat-delete-requests.module';
import { SchoolAdminClubGroupChatDeleteRequestsController } from './school-admin-club-group-chat-delete-requests.controller';

@Module({
  imports: [
    ConfigModule,
    ClubGroupChatDeleteRequestsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminClubGroupChatDeleteRequestsController],
})
export class SchoolAdminClubGroupChatDeleteRequestsModule {}
