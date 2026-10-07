import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { SupportModule } from './support/support.module';
import { FeaturesService } from './features/features.service';
import { FetchEventsModule } from './fetch-events/fetch-events.module';
import { EventAggregationModule } from '../event-aggregation/event-aggregation.module';
import { ExternalModule } from './external/external.module';

@Module({
  imports: [AuthModule, SchoolsModule, SupportModule, FetchEventsModule, EventAggregationModule, ExternalModule],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class SuperAdminModule {}
