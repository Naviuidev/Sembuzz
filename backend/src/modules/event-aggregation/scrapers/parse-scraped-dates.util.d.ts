/** Parse event date lines from Localist, UWM, and common US calendar formats. */
export declare function parseScrapedDateLine(raw: string, zone: string): {
    start: Date | null;
    end: Date | null;
};
/** Find prose ranges like "Jan. 27 - June. 13, 2026" in Localist descriptions. */
export declare function parseDateRangeFromFreeText(text: string, zone: string): {
    start: Date | null;
    end: Date | null;
};
/** @deprecated use parseScrapedDateLine */
export declare const parseLocalistDateLine: typeof parseScrapedDateLine;
