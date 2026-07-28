/**
 * Parser-level event candidate (before GPT validation / structuring).
 * Kept small on purpose — GPT receives only these blobs, not full pages.
 */
export interface EventCandidate {
    /** Stable id for batch prompts (hash prefix). */
    id: string;
    sourcePageUrl: string;
    title: string;
    /** Compact text from the DOM block (headings + body snippet). */
    rawBlockText: string;
    rawDateText?: string;
    rawTimeText?: string;
    detailUrl?: string;
    imageUrl?: string;
}
