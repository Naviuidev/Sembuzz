import { CreateScrapedEventSourceDto } from '../dto/create-scraped-event-source.dto';
import { UpdateScrapedEventSourceDto } from '../dto/update-scraped-event-source.dto';
import { ScrapedEventSourcesService } from './scraped-event-sources.service';
import { ScrapedSyncService } from '../sync/scraped-sync.service';
export declare class ScrapedEventSourcesAdminController {
    private readonly sources;
    private readonly sync;
    constructor(sources: ScrapedEventSourcesService, sync: ScrapedSyncService);
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
        selectorsJson: import("@prisma/client/runtime/library").JsonValue | null;
        logoUrl: string | null;
    }[]>;
    create(dto: CreateScrapedEventSourceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        lastSyncedAt: Date | null;
        active: boolean;
        websiteUrl: string;
        scraperType: string;
        selectorsJson: import("@prisma/client/runtime/library").JsonValue | null;
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
        selectorsJson: import("@prisma/client/runtime/library").JsonValue | null;
        logoUrl: string | null;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
    triggerSync(id: string): Promise<{
        ok: boolean;
        logId: string;
        totalEvents: number;
        errors: string | null;
        details: import("@prisma/client/runtime/library").InputJsonValue;
    }>;
}
