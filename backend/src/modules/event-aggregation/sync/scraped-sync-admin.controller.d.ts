import { ScrapedSyncService } from './scraped-sync.service';
export declare class ScrapedSyncAdminController {
    private readonly sync;
    constructor(sync: ScrapedSyncService);
    logs(sourceId?: string, limit?: string): Promise<({
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
        detailsJson: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    status(): {
        ok: boolean;
        worker: string;
        message: string;
    };
}
