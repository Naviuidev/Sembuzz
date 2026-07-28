import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WebScraperService } from './web-scraper.service';
import { GptExtractorService } from './gpt-extractor.service';
import { UniversityEventValidationService } from './university-event-validation.service';
import { UniversityEventsTimezoneService } from './university-events-timezone.service';
interface SyncResult {
    sourceId: string;
    status: 'completed' | 'failed';
    eventsAdded: number;
    eventsUpdated: number;
    eventsSkipped: number;
    error?: string;
}
export declare class SyncService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly scraper;
    private readonly gpt;
    private readonly config;
    private readonly validator;
    private readonly universityTz;
    private readonly logger;
    private timer;
    /** In-flight per source so concurrent /sync calls don't double-fire. */
    private inFlight;
    constructor(prisma: PrismaService, scraper: WebScraperService, gpt: GptExtractorService, config: ConfigService, validator: UniversityEventValidationService, universityTz: UniversityEventsTimezoneService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    /** Run all active sources with bounded parallelism (default 3; cap 12). */
    syncAllActiveSources(): Promise<SyncResult[]>;
    syncSource(sourceId: string): Promise<SyncResult>;
    /**
     * Dedupe key: aggressively normalized title + calendar date (or raw date text).
     * Venue is intentionally omitted — GPT often varies/absents venue for the same listing row,
     * which previously created many duplicate DB rows.
     */
    private normalizeForDedupeKeyPart;
    private normalizeDetailKeyPart;
    private buildExternalKey;
    /** Read optional `contactInfo` (schema field; some tooling caches older Prisma types). */
    private existingContactInfo;
    private existingExtractionConfidence;
    private upsertEvent;
    /** Collapse duplicate rows returned across GPT chunks before DB upserts (saves writes + API drift). */
    private dedupeExtractedBatch;
    private dateBucketForBatchKey;
    private mergeRicherEvent;
    private dedupeParserCandidates;
    /**
     * Skip GPT for crawled pages whose cleaned text hash matches the last successful sync.
     * Disable with UNIVERSITY_INCREMENTAL_PAGE_HASH=0.
     */
    private filterPagesForIncrementalGpt;
    private persistPageContentHashes;
    private crawlHashDb;
    private buildGptChunks;
    private runWithConcurrency;
}
export {};
