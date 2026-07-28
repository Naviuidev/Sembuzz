import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class ScrapedEventsService {
    private readonly prisma;
    private readonly config;
    constructor(prisma: PrismaService, config: ConfigService);
    private tz;
    list(params: {
        page?: number;
        pageSize?: number;
        category?: string;
        sourceId?: string;
        sort?: 'startDate' | 'title' | 'createdAt';
        order?: 'asc' | 'desc';
    }): Promise<{
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
            occurrenceDatesJson: Prisma.JsonValue | null;
            sourceUrl: string | null;
            sourceWebsite: string | null;
            dedupeKey: string;
            syncedAt: Date | null;
        })[];
    }>;
    upcoming(params: {
        page?: number;
        pageSize?: number;
    }): Promise<{
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
            occurrenceDatesJson: Prisma.JsonValue | null;
            sourceUrl: string | null;
            sourceWebsite: string | null;
            dedupeKey: string;
            syncedAt: Date | null;
        })[];
    }>;
    byMonth(year: number, month: number, params: {
        page?: number;
        pageSize?: number;
    }): Promise<{
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
            occurrenceDatesJson: Prisma.JsonValue | null;
            sourceUrl: string | null;
            sourceWebsite: string | null;
            dedupeKey: string;
            syncedAt: Date | null;
        })[];
    }>;
    getById(id: string): Promise<{
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
        occurrenceDatesJson: Prisma.JsonValue | null;
        sourceUrl: string | null;
        sourceWebsite: string | null;
        dedupeKey: string;
        syncedAt: Date | null;
    }>;
}
