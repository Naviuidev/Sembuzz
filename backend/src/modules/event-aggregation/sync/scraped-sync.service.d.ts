import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UniversityEventsTimezoneService } from '../../super-admin/fetch-events/services/university-events-timezone.service';
import { ScrapedHtmlLoaderService } from '../scrapers/scraped-html-loader.service';
export declare class ScrapedSyncService {
    private readonly prisma;
    private readonly config;
    private readonly htmlLoader;
    private readonly universityTz;
    constructor(prisma: PrismaService, config: ConfigService, htmlLoader: ScrapedHtmlLoaderService, universityTz: UniversityEventsTimezoneService);
    private dateZone;
    /** Same policy as legacy university sync: current calendar month in configured TZ. */
    private filterDraftsByIngestionMonth;
    private buildSyncDetailsJson;
    private extractFromHtml;
    triggerSync(sourceId: string): Promise<{
        ok: boolean;
        logId: string;
        totalEvents: number;
        errors: string | null;
        details: Prisma.InputJsonValue;
    }>;
    listLogs(sourceId?: string, limit?: number): Promise<({
        source: {
            id: string;
            name: string;
            websiteUrl: string;
        };
    } & {
        id: string;
        status: string;
        totalEvents: number;
        sourceId: string;
        startedAt: Date;
        completedAt: Date | null;
        errors: string | null;
        detailsJson: Prisma.JsonValue | null;
    })[]>;
    status(): {
        ok: boolean;
        worker: string;
        message: string;
    };
}
