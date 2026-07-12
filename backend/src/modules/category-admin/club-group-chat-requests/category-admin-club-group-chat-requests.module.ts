import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ClubGroupChatRequestsModule } from '../../club-group-chat-requests/club-group-chat-requests.module';
import { CategoryAdminClubGroupChatRequestsController } from './category-admin-club-group-chat-requests.controller';

@Module({
  imports: [
    ConfigModule,
    ClubGroupChatRequestsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [CategoryAdminClubGroupChatRequestsController],
})
export class CategoryAdminClubGroupChatRequestsModule {}
