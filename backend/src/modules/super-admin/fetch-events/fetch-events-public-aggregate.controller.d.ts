import { FetchEventsService } from './fetch-events.service';
/** Cross-university public feed (all active sources). */
export declare class FetchEventsPublicAggregateController {
    private readonly service;
    constructor(service: FetchEventsService);
    listAll(search?: string, category?: string, upcoming?: string, latest?: string, trending?: string, dateUtc?: string, sort?: string, order?: string, page?: string, pageSize?: string): Promise<{
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
