export interface ParsedSourceRow {
    universityName: string;
    url: string;
}
/** Compact header key: matches "Website URL", "website_url", etc. */
export declare function headerKey(h: string): string;
export declare function csvTextToMatrix(raw: string): string[][];
/**
 * Parse any roster shaped like `sembuzz_master_target_universities_expanded_systems`:
 * Category | System Name | University Name | State | Website URL | ...
 * Uses **University Name** + **Website URL** (or an Events URL column when present).
 */
export declare function parseUniversityMatrix(matrix: string[][]): ParsedSourceRow[];
export declare function parseUniversityCsv(raw: string): ParsedSourceRow[];
