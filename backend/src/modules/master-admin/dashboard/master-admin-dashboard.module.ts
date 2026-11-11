import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { MasterAdminDashboardController } from './master-admin-dashboard.controller';
import { MasterAdminDashboardService } from './master-admin-dashboard.service';

@Module({
  imports: [PrismaModule, MasterAdminAuthModule],
  controllers: [MasterAdminDashboardController],
  providers: [MasterAdminDashboardService],
})
export class MasterAdminDashboardModule {}
