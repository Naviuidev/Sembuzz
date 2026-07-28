import { ScrapedEventsService } from './scraped-events.service';
export declare class ScrapedEventsAdminController {
    private readonly events;
    constructor(events: ScrapedEventsService);
    list(page?: string, pageSize?: string, category?: string, sourceId?: string, sort?: string, order?: string): Promise<{
        total: number;
        page: number;
        pageSize: number;
        items: ({
            source: {
                id: string;
                name: string;
                websiteUrl: string;
            };
        } & {
            category: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            country: string | null;
            city: string | null;
            image: string | null;
            description: string | null;
            startDate: Date | null;
            endDate: Date | null;
            tags: string | null;
            venue: string | null;
            organizer: string | null;
            sourceId: string;
            slug: string;
            occurrenceDatesJson: import("@prisma/client/runtime/library").JsonValue | null;
            sourceUrl: string | null;
            sourceWebsite: string | null;
            dedupeKey: string;
            syncedAt: Date | null;
        })[];
    }>;
    upcoming(page?: string, pageSize?: string): Promise<{
        total: number;
        page: number;
        pageSize: number;
        items: ({
            source: {
                id: string;
                name: string;
                websiteUrl: string;
            };
        } & {
            category: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            country: string | null;
            city: string | null;
            image: string | null;
            description: string | null;
            startDate: Date | null;
            endDate: Date | null;
            tags: string | null;
            venue: string | null;
            organizer: string | null;
            sourceId: string;
            slug: string;
            occurrenceDatesJson: import("@prisma/client/runtime/library").JsonValue | null;
            sourceUrl: string | null;
            sourceWebsite: string | null;
            dedupeKey: string;
            syncedAt: Date | null;
        })[];
    }>;
    month(yearStr?: string, monthStr?: string, page?: string, pageSize?: string): Promise<{
        total: number;
        page: number;
        pageSize: number;
        year: number;
        month: number;
        items: ({
            source: {
                id: string;
                name: string;
                websiteUrl: string;
            };
        } & {
            category: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            country: string | null;
            city: string | null;
            image: string | null;
            description: string | null;
            startDate: Date | null;
            endDate: Date | null;
            tags: string | null;
            venue: string | null;
            organizer: string | null;
            sourceId: string;
            slug: string;
            occurrenceDatesJson: import("@prisma/client/runtime/library").JsonValue | null;
            sourceUrl: string | null;
            sourceWebsite: string | null;
            dedupeKey: string;
            syncedAt: Date | null;
        })[];
    }>;
    one(id: string): Promise<{
        source: {
            id: string;
            name: string;
            websiteUrl: string;
        };
    } & {
        category: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        country: string | null;
        city: string | null;
        image: string | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        tags: string | null;
        venue: string | null;
        organizer: string | null;
        sourceId: string;
        slug: string;
        occurrenceDatesJson: import("@prisma/client/runtime/library").JsonValue | null;
        sourceUrl: string | null;
        sourceWebsite: string | null;
        dedupeKey: string;
        syncedAt: Date | null;
    }>;
}
