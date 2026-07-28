import { FetchEventsService } from './fetch-events.service';
/**
 * Public endpoints for the University Event Aggregator.
 * No authentication: these power the /universities tab on the public events page.
 */
export declare class FetchEventsPublicController {
    private readonly service;
    constructor(service: FetchEventsService);
    listUniversities(): Promise<({
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
    getUniversity(id: string): Promise<{
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
    listEvents(id: string, search?: string, category?: string, upcoming?: string, latest?: string, trending?: string, dateUtc?: string, sort?: string, order?: string, page?: string, pageSize?: string): Promise<{
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
}
