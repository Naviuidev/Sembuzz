import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { SyncService } from './services/sync.service';
import { UniversitySyncJobService } from './services/university-sync-job.service';
import { UniversityEventsTimezoneService } from './services/university-events-timezone.service';
interface ListEventsParams {
    search?: string;
    category?: string;
    sourceId?: string;
    /** Calendar day YYYY-MM-DD in UNIVERSITY_EVENTS_TIMEZONE (default America/New_York) — filters stored startDate to that local day. */
    onDateUtc?: string;
    /** If true: `startDate` from now through end of the **current calendar month** in UNIVERSITY_EVENTS_TIMEZONE. */
    upcoming?: boolean;
    latest?: boolean;
    trending?: boolean;
    sort?: 'startDate' | 'firstSeenAt' | 'title';
    order?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}
export declare class FetchEventsService {
    private readonly prisma;
    private readonly sync;
    private readonly syncJobs;
    private readonly config;
    private readonly universityTz;
    constructor(prisma: PrismaService, sync: SyncService, syncJobs: UniversitySyncJobService, config: ConfigService, universityTz: UniversityEventsTimezoneService);
    ingestCsv(buffer: Buffer, fileName?: string): Promise<{
        totalInCsv: number;
        created: number;
        skipped: number;
        sourceIds: string[];
        batchId: string;
        syncJobId?: string;
    }>;
    addUrlSource(universityName: string, url: string): Promise<{
        sourceId: string;
    }>;
    private ingestRows;
    listSources(): Promise<{
        id: string;
        universityName: string;
        url: string;
        status: string;
        lastSyncedAt: Date | null;
        lastError: string | null;
        totalEvents: number;
        isActive: boolean;
        csvBatchId: string | null;
        csvFileName: string | null;
        csvUploadedAt: Date | null;
        createdAt: Date;
    }[]>;
    /**
     * Aggregate sources by CSV upload batch. Returns one entry per CSV file uploaded,
     * with summary counts. Excludes sources without a batch (those go under "Manual additions").
     */
    listBatches(): Promise<{
        batchId: string;
        fileName: string;
        uploadedAt: Date | null;
        totalSources: number;
        totalEvents: number;
        pending: number;
        syncing: number;
        completed: number;
        failed: number;
    }[]>;
    syncBatch(batchId: string): Promise<{
        ok: boolean;
        queued: number;
        jobId?: undefined;
    } | {
        ok: boolean;
        queued: number;
        jobId: string;
    }>;
    deleteBatch(batchId: string): Promise<{
        ok: boolean;
        deleted: number;
    }>;
    /**
     * Active sources only, with a derived logoUrl from Google's favicon service
     * (no manual config needed for each university).
     * Includes **scraped URL feeds** (Super Admin → Fetch events) merged in and sorted by name.
     */
    listPublicUniversities(): Promise<({
        id: string;
        universityName: string;
        url: string;
        logoUrl: string;
        totalEvents: number;
        lastSyncedAt: Date | null;
        feedKind: "legacy";
    } | {
        id: string;
        universityName: string;
        url: string;
        logoUrl: string;
        totalEvents: number;
        lastSyncedAt: Date | null;
        feedKind: "scraped";
    })[]>;
    getPublicUniversity(id: string): Promise<{
        id: string;
        universityName: string;
        url: string;
        logoUrl: string;
        totalEvents: number;
        lastSyncedAt: Date | null;
        ingestionWindowUtc: {
            timeZone: string;
            firstDayInclusive: string;
            lastDayInclusive: string;
            horizonDays: number;
            currentMonthEndInclusive: string;
            computedAt: string;
        };
        feedKind: "legacy";
    } | {
        id: string;
        universityName: string;
        url: string;
        logoUrl: string;
        totalEvents: number;
        lastSyncedAt: Date | null;
        ingestionWindowUtc: {
            timeZone: string;
            firstDayInclusive: string;
            lastDayInclusive: string;
            horizonDays: number;
            currentMonthEndInclusive: string;
            computedAt: string;
        };
        feedKind: "scraped";
    }>;
    /**
     * Same rules as university sync: **current calendar month** in UNIVERSITY_EVENTS_TIMEZONE.
     * Exposed for public UI (calendar bounds, copy). `horizonDays` = number of days in that month.
     */
    private buildIngestionWindowUtc;
    /** Public "All" tab: current calendar month, including ranges that start before or end after the month. */
    private usesCurrentMonthListScope;
    private appendCurrentMonthOverlapFilter;
    private mapMultiMonthSpan;
    private scrapedOccurrenceDates;
    syncOne(sourceId: string): Promise<{
        ok: boolean;
        jobId?: undefined;
    } | {
        ok: boolean;
        jobId: string;
    }>;
    syncAll(): Promise<{
        ok: boolean;
        jobId?: undefined;
    } | {
        ok: boolean;
        jobId: string;
    }>;
    listSyncJobs(limit?: number): Promise<{
        id: string;
        kind: string;
        batchId: string | null;
        status: string;
        progressDone: number;
        progressTotal: number;
        currentSourceId: string | null;
        message: string | null;
        error: string | null;
        createdAt: Date;
        updatedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    }[]>;
    getSyncJob(jobId: string): Promise<{
        id: string;
        kind: string;
        batchId: string | null;
        status: string;
        progressDone: number;
        progressTotal: number;
        currentSourceId: string | null;
        message: string | null;
        error: string | null;
        createdAt: Date;
        updatedAt: Date;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    listRecentRuns(limit?: number): Promise<{
        id: string;
        sourceId: string;
        universityName: string;
        url: string;
        status: string;
        eventsAdded: number;
        eventsUpdated: number;
        eventsSkipped: number;
        error: string | null;
        startedAt: Date;
        completedAt: Date | null;
        durationMs: number | null;
    }[]>;
    deleteSource(sourceId: string): Promise<{
        ok: boolean;
    }>;
    toggleSourceActive(sourceId: string, isActive: boolean): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        totalEvents: number;
        url: string;
        universityName: string;
        lastSyncedAt: Date | null;
        lastError: string | null;
        csvBatchId: string | null;
        csvFileName: string | null;
        csvUploadedAt: Date | null;
    }>;
    listEvents(params: ListEventsParams): Promise<{
        total: number;
        page: number;
        pageSize: number;
        items: {
            id: string;
            title: string;
            description: string | null;
            summary: null;
            startDate: Date | null;
            endDate: Date | null;
            rawDateText: null;
            rawTimeText: null;
            venue: string | null;
            organizer: string | null;
            category: string | null;
            tags: string[];
            registrationLink: null;
            imageUrl: string | null;
            detailUrl: string | null;
            contactInfo: null;
            extractionConfidence: null;
            firstSeenAt: Date;
            multiMonthSpan: boolean;
            occurrenceDates: string[];
            occurrenceDisplayYmd: string | null;
            multipleOccurrencesInMonth: boolean;
            source: {
                id: string;
                universityName: string;
                url: string;
            };
        }[];
        categories: {
            name: string;
            count: number;
        }[];
    } | {
        total: number;
        page: number;
        pageSize: number;
        items: {
            id: string;
            title: string;
            description: string | null;
            summary: string | null;
            startDate: Date | null;
            endDate: Date | null;
            rawDateText: string | null;
            rawTimeText: string | null;
            venue: string | null;
            organizer: string | null;
            category: string | null;
            tags: string[];
            registrationLink: string | null;
            imageUrl: string | null;
            detailUrl: string | null;
            contactInfo: string | null;
            extractionConfidence: number | null;
            firstSeenAt: Date;
            multiMonthSpan: boolean;
            occurrenceDates: never[];
            occurrenceDisplayYmd: null;
            multipleOccurrencesInMonth: boolean;
            source: {
                id: string;
                url: string;
                universityName: string;
            };
        }[];
        categories: {
            name: string;
            count: number;
        }[];
    }>;
    private listUniversityEvents;
    /** Public listing for {@link ScrapedEventRecord} (URL scrape / Localist feeds). */
    private listScrapedSourceEvents;
    deleteEvent(eventId: string): Promise<{
        ok: boolean;
    }>;
    /**
     * CSV text or Excel (.xlsx / legacy .xls via SheetJS). ZIP magic-bytes used when extension is wrong.
     */
    private parseUniversitySpreadsheetBuffer;
    private hostnameFromUrl;
    /** Google's S2 favicon service — works for any public domain with no config. */
    private deriveLogoUrl;
    /** `contactInfo` exists on DB rows; Prisma `GetPayload` types can lag until `prisma generate`. */
    private eventRowContactInfo;
    private eventRowExtractionConfidence;
    private safeParseJsonArray;
    /** Scraped rows store tags as comma-separated text; university rows use JSON array strings. */
    private tagsFromScrapedStorage;
    /** Matches sync.service dedupe normalization so list API hides duplicate GPT rows. */
    private normalizeFingerprintPart;
    private eventFingerprint;
    private dedupeUniversityEventsByFingerprint;
}
export {};
