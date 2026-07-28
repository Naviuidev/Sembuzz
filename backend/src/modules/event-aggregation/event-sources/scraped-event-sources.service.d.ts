import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateScrapedEventSourceDto } from '../dto/create-scraped-event-source.dto';
import { UpdateScrapedEventSourceDto } from '../dto/update-scraped-event-source.dto';
export declare class ScrapedEventSourcesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        totalEvents: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        lastSyncedAt: Date | null;
        active: boolean;
        websiteUrl: string;
        scraperType: string;
        selectorsJson: Prisma.JsonValue | null;
        logoUrl: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        lastSyncedAt: Date | null;
        active: boolean;
        websiteUrl: string;
        scraperType: string;
        selectorsJson: Prisma.JsonValue | null;
        logoUrl: string | null;
    }>;
    create(dto: CreateScrapedEventSourceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        lastSyncedAt: Date | null;
        active: boolean;
        websiteUrl: string;
        scraperType: string;
        selectorsJson: Prisma.JsonValue | null;
        logoUrl: string | null;
    }>;
    update(id: string, dto: UpdateScrapedEventSourceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        lastSyncedAt: Date | null;
        active: boolean;
        websiteUrl: string;
        scraperType: string;
        selectorsJson: Prisma.JsonValue | null;
        logoUrl: string | null;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
