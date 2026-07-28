import type { RawNormalizedEventDraft } from './base-scraper.abstract';
import type { UniversityIngestionWindow } from '../../super-admin/fetch-events/services/university-events-timezone.service';
/**
 * For Localist recurring cards: load detail JSON-LD instances and description date ranges.
 */
export declare function enrichLocalistRecurringDrafts(drafts: RawNormalizedEventDraft[], win: UniversityIngestionWindow, dateZone: string, maxDetailFetches?: number): Promise<void>;
