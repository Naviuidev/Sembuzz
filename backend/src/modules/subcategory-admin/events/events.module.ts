import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SubCategoryAdminAuthModule } from '../auth/auth.module';
import { SubCategoryAdminBlogsModule } from '../blogs/blogs.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SubCategoryAdminAuthModule,
    SubCategoryAdminBlogsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
