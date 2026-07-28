import { PrismaService } from '../../../prisma/prisma.service';
export declare class JsonEventUploadService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createFromRawEvents(fileName: string, rawEvents: Record<string, unknown>[]): Promise<{
        uploadId: string;
        fileName: string;
        groupCount: number;
        eventCount: number;
        groups: {
            id: string;
            universityName: string;
            calendarUrl: string;
            logoUrl: string | null;
            status: string;
            publishedSourceId: string | null;
            publishedAt: Date | null;
            createdAt: Date;
            eventCount: number;
        }[];
    }>;
    listGroups(): Promise<{
        fileName: string;
        uploadedAt: Date;
        publicLive: boolean;
        id: string;
        universityName: string;
        calendarUrl: string;
        logoUrl: string | null;
        status: string;
        publishedSourceId: string | null;
        publishedAt: Date | null;
        createdAt: Date;
        eventCount: number;
    }[]>;
    getGroup(id: string): Promise<{
        id: string;
        universityName: string;
        calendarUrl: string;
        logoUrl: string | null;
        status: string;
        publishedSourceId: string | null;
        publishedAt: Date | null;
        publicLive: boolean;
        fileName: string;
        uploadedAt: Date;
        eventCount: number;
        events: {
            id: string;
            title: string;
            university: string;
            description: string | null;
            startDate: string | null;
            endDate: string | null;
            startTime: string | null;
            endTime: string | null;
            allDay: boolean;
            venue: string | null;
            detailUrl: string | null;
            posterUrl: string | null;
            logoUrl: string | null;
        }[];
    }>;
    deleteGroup(id: string): Promise<{
        ok: boolean;
    }>;
    publishGroup(id: string): Promise<{
        ok: boolean;
        alreadyPublished: boolean;
        publishedSourceId: string;
        publicLive: boolean;
        eventCount?: undefined;
        universityName?: undefined;
        republished?: undefined;
    } | {
        ok: boolean;
        publishedSourceId: string;
        eventCount: number;
        universityName: string;
        publicLive: boolean;
        republished: boolean;
        alreadyPublished?: undefined;
    }>;
    private isPublishedSourceLive;
    private buildJsonDedupeKey;
    private mapGroupRow;
    private mapEventRow;
}
