import { FetchEventsService } from './fetch-events.service';
export declare class FetchEventsController {
    private readonly service;
    constructor(service: FetchEventsService);
    uploadCsv(file: Express.Multer.File): Promise<{
        totalInCsv: number;
        created: number;
        skipped: number;
        sourceIds: string[];
        batchId: string;
        syncJobId?: string;
    }>;
    uploadUrl(body: {
        url?: string;
        universityName?: string;
    }): Promise<{
        sourceId: string;
    }>;
    syncAll(): Promise<{
        ok: boolean;
        jobId?: undefined;
    } | {
        ok: boolean;
        jobId: string;
    }>;
    syncOne(id: string): Promise<{
        ok: boolean;
        jobId?: undefined;
    } | {
        ok: boolean;
        jobId: string;
    }>;
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
    listSyncJobs(limit?: string): Promise<{
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
    getSyncJob(id: string): Promise<{
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
    listRuns(limit?: string): Promise<{
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
    toggleSource(id: string, body: {
        isActive?: boolean;
    }): Promise<{
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
    deleteSource(id: string): Promise<{
        ok: boolean;
    }>;
    listEvents(search?: string, category?: string, sourceId?: string, upcoming?: string, latest?: string, trending?: string, dateUtc?: string, sort?: string, order?: string, page?: string, pageSize?: string): Promise<{
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
    deleteEvent(id: string): Promise<{
        ok: boolean;
    }>;
}
