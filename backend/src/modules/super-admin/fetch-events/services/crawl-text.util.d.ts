export declare function sha256hex(s: string): string;
/**
 * Shrink listing text before GPT: drop boilerplate-ish lines, collapse short repeats, hard cap length.
 */
export declare function condenseListingTextForGpt(text: string, maxChars: number): string;
