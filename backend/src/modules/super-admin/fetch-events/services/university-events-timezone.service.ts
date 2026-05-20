import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';

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
export function universityEventRangeOverlapsWindow(
  startDate: Date,
  endDate: Date | null | undefined,
  win: Pick<UniversityIngestionWindow, 'timeZone' | 'firstDayInclusive' | 'lastDayInclusive'>,
): boolean {
  if (!startDate || Number.isNaN(startDate.getTime())) return false;
  const tz = win.timeZone;
  const winStart = DateTime.fromISO(win.firstDayInclusive, { zone: tz }).startOf('day');
  const winEnd = DateTime.fromISO(win.lastDayInclusive, { zone: tz }).endOf('day');

  const evStart = DateTime.fromJSDate(startDate, { zone: 'utc' }).setZone(tz).startOf('day');
  const evEnd =
    endDate != null && !Number.isNaN(new Date(endDate).getTime())
      ? DateTime.fromJSDate(new Date(endDate), { zone: 'utc' }).setZone(tz).endOf('day')
      : DateTime.fromJSDate(startDate, { zone: 'utc' }).setZone(tz).endOf('day');

  if (evEnd < evStart) return false;
  return evStart <= winEnd && evEnd >= winStart;
}

@Injectable()
export class UniversityEventsTimezoneService {
  constructor(private readonly config: ConfigService) {}

  /** Default US Eastern (handles EST/EDT). Override with UNIVERSITY_EVENTS_TIMEZONE. */
  getIanaTimeZone(): string {
    const z = this.config.get<string>('UNIVERSITY_EVENTS_TIMEZONE')?.trim();
    if (z && z.length > 0) return z;
    return 'America/New_York';
  }

  /** Today's date YYYY-MM-DD in the ingestion time zone. */
  getTodayLocalIsoDate(now = new Date()): string {
    const timeZone = this.getIanaTimeZone();
    return DateTime.fromJSDate(now, { zone: 'utc' }).setZone(timeZone).toISODate()!;
  }

  /**
   * Default university sync window: the full **calendar month** containing `now` in
   * `UNIVERSITY_EVENTS_TIMEZONE` (e.g. May 1–May 31 local). Persist only events whose
   * **date range** (startDate … endDate, inclusive local days) **overlaps** that month
   * (e.g. March–June includes May).
   */
  getCurrentCalendarMonthWindow(now = new Date()): UniversityIngestionWindow {
    const timeZone = this.getIanaTimeZone();
    const zonedNow = DateTime.fromJSDate(now, { zone: 'utc' }).setZone(timeZone);
    const monthStart = zonedNow.startOf('month').startOf('day');
    const nextMonthStart = monthStart.plus({ months: 1 });
    const startUtc = monthStart.toUTC().toJSDate();
    const endExclusiveUtc = nextMonthStart.toUTC().toJSDate();
    const firstDayInclusive = monthStart.toISODate()!;
    const lastDayInclusive = nextMonthStart.minus({ days: 1 }).toISODate()!;
    const dim = zonedNow.daysInMonth ?? 31;

    return {
      timeZone,
      firstDayInclusive,
      lastDayInclusive,
      horizonDays: dim,
      startUtc,
      endExclusiveUtc,
      currentMonthEndInclusive: lastDayInclusive,
      computedAtIso: now.toISOString(),
    };
  }

  /**
   * Interpret `localYmd` as a calendar day in the ingestion time zone; return UTC half-open bounds
   * suitable for Prisma `startDate` filters.
   */
  getUtcBoundsForLocalCalendarDay(localYmd: string): { startUtc: Date; endExclusiveUtc: Date } | null {
    const timeZone = this.getIanaTimeZone();
    const startLocal = DateTime.fromISO(localYmd.slice(0, 10), { zone: timeZone }).startOf('day');
    if (!startLocal.isValid) return null;
    const endExclusiveLocal = startLocal.plus({ days: 1 });
    return {
      startUtc: startLocal.toUTC().toJSDate(),
      endExclusiveUtc: endExclusiveLocal.toUTC().toJSDate(),
    };
  }
}
