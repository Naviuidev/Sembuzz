import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ClubGroupChatRequestsModule } from '../../club-group-chat-requests/club-group-chat-requests.module';
import { SubCategoryAdminClubGroupChatRequestsController } from './subcategory-admin-club-group-chat-requests.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ClubGroupChatRequestsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SubCategoryAdminClubGroupChatRequestsController],
})
export class SubCategoryAdminClubGroupChatRequestsModule {}
