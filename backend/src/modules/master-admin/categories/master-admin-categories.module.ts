import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../../school-admin/categories/categories.module';
import { MasterAdminCategoriesController } from './master-admin-categories.controller';
import { MasterAdminCategoriesService } from './master-admin-categories.service';

@Module({
  imports: [PrismaModule, MasterAdminAuthModule, CategoriesModule],
  controllers: [MasterAdminCategoriesController],
  providers: [MasterAdminCategoriesService],
})
export class MasterAdminCategoriesModule {}
