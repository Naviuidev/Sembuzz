import type { EventCandidate } from './event-candidate.types';
export declare class EventCandidateExtractorService {
    /**
     * Deterministic extraction: JSON-LD Event, <time datetime>, and article-like blocks.
     * Does not call GPT — output is fed to the validator model in small batches.
     */
    extractFromHtml(pageUrl: string, html: string): EventCandidate[];
    private collectJsonLd;
    private collectTimeAnchored;
    private collectArticles;
}
