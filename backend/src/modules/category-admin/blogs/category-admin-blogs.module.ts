import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CategoryAdminAuthModule } from '../auth/auth.module';
import { CategoryAdminBlogsController } from './category-admin-blogs.controller';
import { CategoryAdminBlogsService } from './category-admin-blogs.service';

@Module({
  imports: [PrismaModule, CategoryAdminAuthModule],
  controllers: [CategoryAdminBlogsController],
  providers: [CategoryAdminBlogsService],
  exports: [CategoryAdminBlogsService],
})
export class CategoryAdminBlogsModule {}
