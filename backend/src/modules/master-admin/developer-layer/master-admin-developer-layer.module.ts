import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { EmailService } from '../../super-admin/schools/email.service';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { PlatformMasterAdminGuard } from '../guards/platform-master-admin.guard';
import { MasterAdminDeveloperLayerController } from './master-admin-developer-layer.controller';
import { MasterAdminDeveloperLayerService } from './master-admin-developer-layer.service';

@Module({
  imports: [PrismaModule, MasterAdminAuthModule],
  controllers: [MasterAdminDeveloperLayerController],
  providers: [MasterAdminDeveloperLayerService, EmailService, PlatformMasterAdminGuard],
})
export class MasterAdminDeveloperLayerModule {}
