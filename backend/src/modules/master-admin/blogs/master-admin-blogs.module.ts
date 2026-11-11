import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { MasterAdminBlogsController } from './master-admin-blogs.controller';
import { MasterAdminBlogsService } from './master-admin-blogs.service';

@Module({
  imports: [PrismaModule, MasterAdminAuthModule],
  controllers: [MasterAdminBlogsController],
  providers: [MasterAdminBlogsService],
})
export class MasterAdminBlogsModule {}
