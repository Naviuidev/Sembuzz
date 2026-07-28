import { ExtractedEvent } from './gpt-extractor.service';
import { type UniversityIngestionWindow } from './university-events-timezone.service';
export declare class UniversityEventValidationService {
    /**
     * Heuristic 0–100 score for QA dashboards. GPT may adjust slightly in payload;
     * we merge with Math.round((local + model) / 2) when model provides qaScore.
     */
    computeLocalConfidence(ev: ExtractedEvent, seedUrl: string): number;
    mergeConfidence(local: number, modelQa?: number | null): number;
    /**
     * Hard gate before DB write: event **range** must overlap the sync calendar month in `win.timeZone`.
     * Multi-month listings must set `endDate` so May appears inside a March–June range.
     */
    shouldPersist(ev: ExtractedEvent, win: UniversityIngestionWindow, seedUrl: string): {
        ok: boolean;
        reason?: string;
    };
    private isLikelyValidHttpUrl;
    private isSameSiteOrSubdomain;
}
