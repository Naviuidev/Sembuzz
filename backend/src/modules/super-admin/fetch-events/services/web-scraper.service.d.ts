import { ConfigService } from '@nestjs/config';
import { PlaywrightRendererService } from './playwright-renderer.service';
import { EventCandidateExtractorService } from './event-candidate-extractor.service';
import type { EventCandidate } from './event-candidate.types';
export interface ScrapedPage {
    url: string;
    cleanedText: string;
    candidateImages: string[];
    detailLinks: string[];
    htmlLength: number;
    /** Parser-extracted rows (JSON-LD, time anchors, articles) — primary GPT input. */
    eventCandidates?: EventCandidate[];
}
/**
 * Minimal-dependency HTML scraper. Uses Node `fetch`, strips noise via regex,
 * and produces a compact text representation suitable for GPT input.
 *
 * `crawlFromSeed` walks same-origin links (pagination, categories, archives)
 * up to UNIVERSITY_CRAWL_MAX_PAGES so listing URLs can be processed end-to-end.
 * Optional Playwright (UNIVERSITY_PLAYWRIGHT=1) re-fetches thin JS shells after the static pass.
 */
export declare class WebScraperService {
    private readonly config;
    private readonly playwright;
    private readonly eventCandidates;
    private readonly logger;
    private readonly crawlMaxPages;
    private readonly crawlDelayMs;
    private readonly maxDetailPrefetch;
    private readonly crawlFetchParallel;
    constructor(config: ConfigService, playwright: PlaywrightRendererService, eventCandidates: EventCandidateExtractorService);
    fetchAndClean(url: string): Promise<ScrapedPage>;
    /**
     * Breadth-first crawl starting at `seedUrl`, same hostname only.
     * Enqueues listing-like URLs (pagination query params, /events/, /calendar/, categories, rel=next).
     */
    crawlFromSeed(seedUrl: string): Promise<ScrapedPage[]>;
    /** LiveWhale /live/json/events payloads are loosely typed; we only read known fields. */
    private isLiveWhaleEventRow;
    private stripHtmlToText;
    private isLiveWhaleCalendarHtml;
    /**
     * Fetch the standard LiveWhale upcoming-events JSON and turn it into listing text for GPT.
     * Same-origin path `/live/json/events` is used by many LiveWhale campus calendars.
     */
    private tryBuildPageFromLiveWhaleJson;
    private fetchHtmlStatic;
    /** Static fetch first; optional Playwright pass when the response looks like a JS shell. */
    private fetchHtml;
    /** Follow individual event pages discovered on listings (slug URLs, ?event=, etc.). */
    private isLikelyEventDetailUrl;
    /**
     * Strip noise, preserve helpful structural hints (headings, links, images, dates).
     */
    clean(baseUrl: string, html: string): ScrapedPage;
    private extractMainSection;
    private extractImageUrls;
    private extractDetailLinks;
    private toAbsolute;
    private looksLikeContentImage;
    private decodeEntities;
    /** Stable URL for de-duplication (no hash, sorted query, trimmed trailing slash on path). */
    private normalizeUrl;
    /**
     * Pagination and category nav are almost always in the first/last parts of the document.
     * Scanning a trimmed slice avoids pathological RAM/CPU on very large HTML files.
     */
    private htmlSliceForLinkScan;
    /**
     * Extract same-origin URLs worth following for event listings: pagination,
     * category hubs, calendar views, archives, and `<link rel="next">`.
     */
    private discoverCrawlTargets;
    private crawlLinkScore;
    /**
     * Down-rank admissions, blogs, news, etc. unless the URL still looks like an event/calendar hub.
     */
    private nonEventPathPenalty;
}
