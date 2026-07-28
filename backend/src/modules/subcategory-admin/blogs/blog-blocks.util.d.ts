/** MySQL TEXT ≈ 65,535 bytes; stay under to avoid insert failures (UTF-8 multi-byte). */
export declare function clipForMysqlText(s: string, maxBytes?: number): string;
/** Sanitize and persist blog contentBlocks JSON; matches public reader types. */
export type SanitizedBlock = {
    type: 'heading';
    value: string;
    cols: number;
} | {
    type: 'paragraph';
    value: string;
    cols: number;
} | {
    type: 'image';
    imageUrl: string;
    cols: number;
    alt?: string;
} | {
    type: 'heading_para';
    heading: string;
    paragraph: string;
    cols: number;
};
export declare function sanitizeContentBlocks(raw: unknown): SanitizedBlock[] | null;
export declare function blocksHaveText(blocks: SanitizedBlock[] | null): boolean;
export declare function extractTextFromBlocks(blocks: SanitizedBlock[] | null): string;
