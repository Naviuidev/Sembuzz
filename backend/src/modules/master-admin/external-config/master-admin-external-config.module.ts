import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { SchoolAdminExternalPipelineModule } from '../../school-admin/external-pipeline/external-pipeline.module';
import { SchoolAdminExternalPostRequestsModule } from '../../school-admin/external-post-requests/external-post-requests.module';
import { ExternalAdminPostRequestsModule } from '../../external-admin/post-requests/post-requests.module';
import { MasterAdminExternalConfigController } from './master-admin-external-config.controller';
import { MasterAdminExternalConfigService } from './master-admin-external-config.service';

@Module({
  imports: [
    PrismaModule,
    MasterAdminAuthModule,
    SchoolAdminExternalPipelineModule,
    SchoolAdminExternalPostRequestsModule,
    ExternalAdminPostRequestsModule,
  ],
  controllers: [MasterAdminExternalConfigController],
  providers: [MasterAdminExternalConfigService],
})
export class MasterAdminExternalConfigModule {}
