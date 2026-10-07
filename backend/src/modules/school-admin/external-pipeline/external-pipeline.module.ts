import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PipelineRequestMessagesModule } from '../../external-pipeline-request-messages/pipeline-request-messages.module';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { SchoolAdminExternalPipelineController } from './external-pipeline.controller';
import { SchoolAdminExternalPipelineService } from './external-pipeline.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SchoolsModule,
    PipelineRequestMessagesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [SchoolAdminExternalPipelineController],
  providers: [SchoolAdminExternalPipelineService, SchoolAdminGuard],
})
export class SchoolAdminExternalPipelineModule {}
