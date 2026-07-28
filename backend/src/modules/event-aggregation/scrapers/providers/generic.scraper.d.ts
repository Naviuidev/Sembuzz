import { BaseScraper, type RawNormalizedEventDraft } from '../base-scraper.abstract';
import type { GenericSelectorConfig } from '../selector-config.types';
export declare class GenericSelectorScraper extends BaseScraper {
    private dateZone;
    setDateZone(zone: string): void;
    loadRenderedHtml(url: string): Promise<string>;
    extractEvents(html: string, selectors: GenericSelectorConfig): {
        drafts: RawNormalizedEventDraft[];
        extractionMode: 'generic' | 'localist' | 'uwm' | 'none';
    };
    /** Localist → UWM (WordPress) when selectors are empty. */
    private autoDetect;
    private extractWithListItems;
    /** Localist Community Event Platform – e.g. https://events.miamioh.edu/ */
    private extractLocalist;
    /**
     * Localist uses `p.em-text_icon` on featured cards and `p.em-card_event-text` on list rows
     * (e.g. https://events.miamioh.edu/).
     */
    private extractLocalistDateAndVenue;
    /** JSON-LD `<script>` often sits immediately before the `.em-card` on Localist listing pages. */
    private findAdjacentLocalistJsonLd;
    /** Prefer dated rows; fill image/venue from duplicates (carousel vs list markup). */
    private mergeLocalistDrafts;
    /** UWM / WordPress calendar – e.g. https://uwm.edu/events/ */
    private extractUwm;
    private extractJsonLd;
    private collectJsonLdEvents;
}
export declare function buildDedupeKey(sourceId: string, draft: RawNormalizedEventDraft): string;
export declare function buildSlug(draft: RawNormalizedEventDraft, dedupeKey: string): string;
