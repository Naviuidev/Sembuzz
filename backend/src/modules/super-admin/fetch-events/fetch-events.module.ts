import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { FetchEventsController } from './fetch-events.controller';
import { FetchEventsPublicController } from './fetch-events-public.controller';
import { FetchEventsService } from './fetch-events.service';
import { EventCandidateExtractorService } from './services/event-candidate-extractor.service';
import { UniversityEventValidationService } from './services/university-event-validation.service';
import { WebScraperService } from './services/web-scraper.service';
import { GptExtractorService } from './services/gpt-extractor.service';
import { SyncService } from './services/sync.service';
import { UniversitySyncJobService } from './services/university-sync-job.service';
import { UniversityEventsTimezoneService } from './services/university-events-timezone.service';
import { PlaywrightRendererService } from './services/playwright-renderer.service';
import { FetchEventsPublicAggregateController } from './fetch-events-public-aggregate.controller.js';

@Module({
  imports: [
    ConfigModule,
    // Reuse the same JWT config as other super-admin sub-modules so SuperAdminGuard works.
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [FetchEventsController, FetchEventsPublicController, FetchEventsPublicAggregateController],
  providers: [
    UniversityEventsTimezoneService,
    EventCandidateExtractorService,
    UniversityEventValidationService,
    PlaywrightRendererService,
    WebScraperService,
    GptExtractorService,
    SyncService,
    UniversitySyncJobService,
    FetchEventsService,
  ],
  exports: [FetchEventsService, PlaywrightRendererService, UniversityEventsTimezoneService],
})
export class FetchEventsModule {}
