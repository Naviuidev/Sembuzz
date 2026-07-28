import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SubCategoryAdminDirectChatsController } from './subcategory-admin-direct-chats.controller';
import { SubCategoryAdminDirectChatsService } from './subcategory-admin-direct-chats.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SubCategoryAdminDirectChatsController],
  providers: [SubCategoryAdminDirectChatsService],
})
export class SubCategoryAdminDirectChatsModule {}
