import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CategoryAdminDirectChatsController } from './category-admin-direct-chats.controller';
import { CategoryAdminDirectChatsService } from './category-admin-direct-chats.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [CategoryAdminDirectChatsController],
  providers: [CategoryAdminDirectChatsService],
})
export class CategoryAdminDirectChatsModule {}
