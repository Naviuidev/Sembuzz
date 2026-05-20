import type { GenericSelectorConfig } from './selector-config.types';

/** Normalized row before persistence / dedupe (Phase 3–5). */
export interface RawNormalizedEventDraft {
  title: string;
  description?: string | null;
  image?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  sourceUrl?: string | null;
  category?: string | null;
  organizer?: string | null;
  tags?: string[];
}

export type ExtractEventsResult = {
  drafts: RawNormalizedEventDraft[];
  extractionMode: 'generic' | 'localist' | 'uwm' | 'none';
};

/**
 * Provider hook for Playwright + Cheerio pipeline (Phase 3).
 * Concrete implementations: generic, university, eventbrite, etc.
 */
export abstract class BaseScraper {
  abstract loadRenderedHtml(url: string): Promise<string>;

  abstract extractEvents(html: string, selectors: GenericSelectorConfig): ExtractEventsResult;

  normalizeWhitespace(s: string): string {
    return s.replace(/\s+/g, ' ').trim();
  }
}
