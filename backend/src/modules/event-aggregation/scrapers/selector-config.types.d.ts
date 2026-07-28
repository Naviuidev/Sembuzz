/**
 * Admin-configurable CSS selectors for generic scraping (Phase 4).
 */
export interface GenericSelectorConfig {
    titleSelector?: string;
    descriptionSelector?: string;
    dateSelector?: string;
    imageSelector?: string;
    locationSelector?: string;
    linkSelector?: string;
    /** Root container for repeating event blocks (optional). */
    listItemSelector?: string;
    /**
     * Built-in extractors (used when listItemSelector/titleSelector are empty).
     * `auto` = detect Localist → UWM → generic JSON-LD.
     */
    preset?: 'localist' | 'uwm' | 'auto';
}
