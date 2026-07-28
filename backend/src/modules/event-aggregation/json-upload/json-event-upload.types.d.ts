export type JsonUploadRawEvent = Record<string, unknown>;
export interface NormalizedJsonUploadEvent {
    universityName: string;
    calendarUrl: string;
    logoUrl: string | null;
    title: string;
    description: string | null;
    startDate: Date | null;
    endDate: Date | null;
    startTime: string | null;
    endTime: string | null;
    allDay: boolean;
    venue: string | null;
    detailUrl: string | null;
    posterUrl: string | null;
}
export declare function parseYmdToDate(ymd: string | null): Date | null;
export declare function normalizeJsonUploadEvent(raw: JsonUploadRawEvent): NormalizedJsonUploadEvent | null;
export declare function groupKey(universityName: string, calendarUrl: string): string;
