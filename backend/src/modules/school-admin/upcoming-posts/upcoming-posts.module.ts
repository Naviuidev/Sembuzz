import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { UpcomingPostsController } from './upcoming-posts.controller';
import { UpcomingPostsService } from './upcoming-posts.service';

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
  controllers: [UpcomingPostsController],
  providers: [UpcomingPostsService, SchoolAdminGuard],
  exports: [UpcomingPostsService],
})
export class UpcomingPostsModule {}
