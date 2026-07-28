import { ConfigService } from '@nestjs/config';
import type { EventCandidate } from './event-candidate.types';
import { type UniversityIngestionWindow } from './university-events-timezone.service';
export interface ExtractedEvent {
    title: string;
    description?: string;
    summary?: string;
    startDate?: string | null;
    endDate?: string | null;
    rawDateText?: string;
    rawTimeText?: string;
    venue?: string;
    organizer?: string;
    category?: string;
    tags?: string[];
    registrationLink?: string;
    imageUrl?: string;
    detailUrl?: string;
    contactInfo?: string;
    /** Model-side QA score 0–100 (merged with local heuristics before persist). */
    modelQaScore?: number;
}
export interface ValidateCandidatesContext {
    universityName: string;
    sourceUrl: string;
    timeZone: string;
    todayLocalYmd: string;
    firstDayInclusiveLocal: string;
    lastDayInclusiveLocal: string;
    ingestionStartUtc: string;
    ingestionEndExclusiveUtc: string;
    candidates: EventCandidate[];
}
interface ExtractRequestContext {
    universityName: string;
    sourceUrl: string;
    cleanedText: string;
    candidateImages: string[];
    detailLinks: string[];
    timeZone: string;
    todayLocalYmd: string;
    firstDayLocalYmd: string;
    lastDayLocalYmd: string;
    ingestionStartUtcIso: string;
    ingestionEndExclusiveUtcIso: string;
    chunkIndex?: number;
    chunkTotal?: number;
}
export declare class GptExtractorService {
    private readonly config;
    private readonly logger;
    private openai;
    private readonly extractModel;
    constructor(config: ConfigService);
    isReady(): boolean;
    /**
     * Parser-first path: GPT validates / normalizes pre-extracted rows only (small JSON payloads).
     */
    validateCandidates(ctx: ValidateCandidatesContext): Promise<ExtractedEvent[]>;
    /** Legacy fallback: condensed page text when parser coverage is too thin. */
    extract(ctx: ExtractRequestContext): Promise<ExtractedEvent[]>;
    private coerce;
    private str;
    private iso;
    private extractedOverlapsWindow;
    /** Keep rows whose local date range overlaps the sync calendar month in `win`. */
    filterExtractedByIngestionWindow(events: ExtractedEvent[], win: UniversityIngestionWindow): ExtractedEvent[];
    private isRetryableRateLimit;
}
export {};
