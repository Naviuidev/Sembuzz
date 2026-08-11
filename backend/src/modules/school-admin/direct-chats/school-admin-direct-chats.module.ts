import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SchoolAdminDirectChatsController } from './school-admin-direct-chats.controller';
import { SchoolAdminDirectChatsService } from './school-admin-direct-chats.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminDirectChatsController],
  providers: [SchoolAdminDirectChatsService],
})
export class SchoolAdminDirectChatsModule {}
