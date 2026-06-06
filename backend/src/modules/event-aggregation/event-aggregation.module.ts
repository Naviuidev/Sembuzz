import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { FetchEventsModule } from '../super-admin/fetch-events/fetch-events.module';
import { ScrapedEventsAdminController } from './events/scraped-events-admin.controller';
import { ScrapedEventsService } from './events/scraped-events.service';
import { ScrapedEventSourcesAdminController } from './event-sources/scraped-event-sources-admin.controller';
import { ScrapedEventSourcesService } from './event-sources/scraped-event-sources.service';
import { ScrapedSyncAdminController } from './sync/scraped-sync-admin.controller';
import { ScrapedSyncService } from './sync/scraped-sync.service';
import { ScrapedHtmlLoaderService } from './scrapers/scraped-html-loader.service';
import { JsonEventUploadAdminController } from './json-upload/json-event-upload-admin.controller';
import { JsonEventUploadService } from './json-upload/json-event-upload.service';

@Module({
  imports: [
    ConfigModule,
    FetchEventsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    ScrapedEventsAdminController,
    ScrapedEventSourcesAdminController,
    ScrapedSyncAdminController,
    JsonEventUploadAdminController,
  ],
  providers: [
    ScrapedEventsService,
    ScrapedEventSourcesService,
    ScrapedHtmlLoaderService,
    ScrapedSyncService,
    JsonEventUploadService,
  ],
  exports: [
    ScrapedEventsService,
    ScrapedEventSourcesService,
    ScrapedSyncService,
    JsonEventUploadService,
  ],
})
export class EventAggregationModule {}
