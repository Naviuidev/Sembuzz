import { Module } from '@nestjs/common';
import { QueriesModule } from '../../school-admin/queries/queries.module';
import { SchoolsModule } from '../../super-admin/schools/schools.module';
import { MeetingsModule } from '../../meetings/meetings.module';
import { MasterAdminAuthModule } from '../auth/auth.module';
import { MasterAdminQueriesController } from './master-admin-queries.controller';
import { MasterAdminQueriesService } from './master-admin-queries.service';

@Module({
  imports: [MasterAdminAuthModule, MeetingsModule, QueriesModule, SchoolsModule],
  controllers: [MasterAdminQueriesController],
  providers: [MasterAdminQueriesService],
})
export class MasterAdminQueriesModule {}
