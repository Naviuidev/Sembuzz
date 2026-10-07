import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PipelineRequestMessagesModule } from '../../external-pipeline-request-messages/pipeline-request-messages.module';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { ExternalAdminGuard } from '../guards/external-admin.guard';
import { ExternalAdminPipelineController } from './pipeline.controller';
import { ExternalAdminPipelineService } from './pipeline.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PipelineRequestMessagesModule,
    SchoolsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ExternalAdminPipelineController],
  providers: [ExternalAdminPipelineService, ExternalAdminGuard],
})
export class ExternalAdminPipelineModule {}
