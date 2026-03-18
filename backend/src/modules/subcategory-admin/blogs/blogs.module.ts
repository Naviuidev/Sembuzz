import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SubCategoryAdminAuthModule } from '../auth/auth.module';
import { SubCategoryAdminBlogsController } from './blogs.controller';
import { SubCategoryAdminBlogsService } from './blogs.service';

@Module({
  imports: [PrismaModule, SubCategoryAdminAuthModule],
  controllers: [SubCategoryAdminBlogsController],
  providers: [SubCategoryAdminBlogsService],
  exports: [SubCategoryAdminBlogsService],
})
export class SubCategoryAdminBlogsModule {}
