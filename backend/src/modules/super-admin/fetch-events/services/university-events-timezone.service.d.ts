import { ConfigService } from '@nestjs/config';
/** Sync / listing window: calendar days in `timeZone`, with exact UTC bounds for DB queries. */
export interface UniversityIngestionWindow {
    /** IANA zone, e.g. America/New_York */
    timeZone: string;
    /** Local calendar YYYY-MM-DD (first day of the sync window, inclusive). */
    firstDayInclusive: string;
    /** Local calendar YYYY-MM-DD (last day of the sync window, inclusive). */
    lastDayInclusive: string;
    /** Number of local calendar days in the window (for the current-month policy = days in that month). */
    horizonDays: number;
    /** Inclusive lower bound in UTC for `startDate`. */
    startUtc: Date;
    /** Exclusive upper bound in UTC (first instant after last allowed local day). */
    endExclusiveUtc: Date;
    /** Same as `lastDayInclusive` for current-month windows; kept for API compatibility. */
    currentMonthEndInclusive: string;
    computedAtIso: string;
}
/**
 * Inclusive calendar-day overlap in `win.timeZone` between the event's [startDate … endDate]
 * and the sync window [firstDayInclusive … lastDayInclusive].
 * If `endDate` is missing, the event is treated as a single local day at `startDate`.
 */
/**
 * Prisma filter: event local date range overlaps [firstDayInclusive … lastDayInclusive].
 * Use for public "All" listings (current calendar month + multi-month spans).
 */
/** Prisma `where` for events whose local date range overlaps the sync month (UTC bounds). */
export declare function prismaMonthOverlapWhereInput(win: Pick<UniversityIngestionWindow, 'startUtc' | 'endExclusiveUtc'>): {
    startDate: {
        not: null;
    };
    AND: ({
        startDate: {
            lt: Date;
        };
        OR?: undefined;
    } | {
        OR: ({
            AND: ({
                endDate: {
                    not: null;
                    gte?: undefined;
                };
            } | {
                endDate: {
                    gte: Date;
                    not?: undefined;
                };
            })[];
        } | {
            AND: ({
                endDate: null;
                startDate?: undefined;
            } | {
                startDate: {
                    gte: Date;
                    lt?: undefined;
                };
                endDate?: undefined;
            } | {
                startDate: {
                    lt: Date;
                    gte?: undefined;
                };
                endDate?: undefined;
            })[];
        })[];
        startDate?: undefined;
    })[];
};
/** True when the event runs before or after the sync/listing month (multi-month / long-running). */
export declare function universityEventSpansOutsideIngestionMonth(startDate: Date, endDate: Date | null | undefined, win: Pick<UniversityIngestionWindow, 'timeZone' | 'firstDayInclusive' | 'lastDayInclusive'>): boolean;
export declare function universityEventRangeOverlapsWindow(startDate: Date, endDate: Date | null | undefined, win: Pick<UniversityIngestionWindow, 'timeZone' | 'firstDayInclusive' | 'lastDayInclusive'>): boolean;
export declare class UniversityEventsTimezoneService {
    private readonly config;
    constructor(config: ConfigService);
    /** Default US Eastern (handles EST/EDT). Override with UNIVERSITY_EVENTS_TIMEZONE. */
    getIanaTimeZone(): string;
    /** Today's date YYYY-MM-DD in the ingestion time zone. */
    getTodayLocalIsoDate(now?: Date): string;
    /**
     * Default university sync window: the full **calendar month** containing `now` in
     * `UNIVERSITY_EVENTS_TIMEZONE` (e.g. May 1–May 31 local). Persist only events whose
     * **date range** (startDate … endDate, inclusive local days) **overlaps** that month
     * (e.g. March–June includes May).
     */
    getCurrentCalendarMonthWindow(now?: Date): UniversityIngestionWindow;
    /**
     * Interpret `localYmd` as a calendar day in the ingestion time zone; return UTC half-open bounds
     * suitable for Prisma `startDate` filters.
     */
    getUtcBoundsForLocalCalendarDay(localYmd: string): {
        startUtc: Date;
        endExclusiveUtc: Date;
    } | null;
}
