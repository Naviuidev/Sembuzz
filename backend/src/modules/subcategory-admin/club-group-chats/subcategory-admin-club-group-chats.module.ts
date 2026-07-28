import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SubCategoryAdminClubGroupChatsController } from './subcategory-admin-club-group-chats.controller';
import { SubCategoryAdminClubGroupChatsService } from './subcategory-admin-club-group-chats.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SubCategoryAdminClubGroupChatsController],
  providers: [SubCategoryAdminClubGroupChatsService],
})
export class SubCategoryAdminClubGroupChatsModule {}
