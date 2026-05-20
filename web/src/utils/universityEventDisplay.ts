import { DateTime } from 'luxon';
import type { PublicUniversityIngestionWindowUtc } from '../services/public-universities.service';

/** Matches backend default `UNIVERSITY_EVENTS_TIMEZONE` when the API omits a zone. */
export const DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ = 'America/New_York';

/** True when event runs before or after the listing month (red card border). */
export function universityEventSpansOutsideMonth(
  event: { startDate: string | null; endDate: string | null },
  w: PublicUniversityIngestionWindowUtc | undefined,
): boolean {
  if (!event.startDate || !w?.firstDayInclusive || !w?.lastDayInclusive) return false;
  const tz = w.timeZone || DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ;
  const winStart = DateTime.fromISO(w.firstDayInclusive, { zone: tz }).startOf('day');
  const winEnd = DateTime.fromISO(w.lastDayInclusive, { zone: tz }).endOf('day');
  const evStart = DateTime.fromISO(event.startDate.slice(0, 10), { zone: tz }).startOf('day');
  const endIso = (event.endDate || event.startDate).slice(0, 10);
  const evEnd = DateTime.fromISO(endIso, { zone: tz }).endOf('day');
  return evStart < winStart || evEnd > winEnd;
}

/** Human label for the sync/list month window, e.g. "May 1 – May 31, 2026". */
export function formatIngestionMonthWindowLabel(w: PublicUniversityIngestionWindowUtc): string {
  const tz = w.timeZone || DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ;
  const start = new Date(`${w.firstDayInclusive}T12:00:00`);
  const end = new Date(`${w.lastDayInclusive}T12:00:00`);
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: tz };
  return `${start.toLocaleDateString('en-US', fmt)} – ${end.toLocaleDateString('en-US', fmt)}`;
}

export function formatUniversityEventDateInZone(
  iso: string | null,
  timeZone: string,
  fallback?: string | null,
): string {
  if (!iso) return fallback || '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback || '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(d);
}

export function shortUniversityTimeZoneLabel(iana: string): string {
  if (iana === 'America/New_York') return 'Eastern';
  const tail = iana.split('/').pop();
  return tail?.replace(/_/g, ' ') || iana;
}

/** Native `title` tooltip: event name + source text + formatted range when multi-day. */
export function universityEventTitleTooltip(
  title: string,
  event: { startDate: string | null; endDate: string | null; rawDateText: string | null },
  timeZone: string,
): string {
  const chunks: string[] = [];
  if (title.trim()) chunks.push(title.trim());
  const raw = event.rawDateText?.trim();
  if (raw) chunks.push(raw);
  if (event.startDate && event.endDate) {
    const a = formatUniversityEventDateInZone(event.startDate, timeZone, null);
    const b = formatUniversityEventDateInZone(event.endDate, timeZone, null);
    const sameDay = event.startDate.slice(0, 10) === event.endDate.slice(0, 10);
    if (a && b && !sameDay) {
      chunks.push(`Runs ${a} – ${b} (${shortUniversityTimeZoneLabel(timeZone)} calendar dates)`);
    }
  } else if (event.startDate) {
    const a = formatUniversityEventDateInZone(event.startDate, timeZone, null);
    if (a) chunks.push(a);
  }
  return chunks.join('\n\n');
}

/** Format occurrence date list for loop-icon tooltip (weekday + short date). */
export function formatOccurrenceDatesTooltip(
  dates: string[],
  timeZone: string,
): string {
  if (!dates.length) return '';
  const fmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  });
  return dates
    .map((ymd) => {
      const d = new Date(`${ymd}T12:00:00`);
      return fmt.format(d);
    })
    .join('\n');
}

/** Primary line when event has multiple instances in the month. */
export function formatUniversityEventCardDateWithOccurrences(
  event: {
    startDate: string | null;
    endDate: string | null;
    rawDateText: string | null;
    occurrenceDates?: string[];
    occurrenceDisplayYmd?: string | null;
  },
  timeZone: string,
): string {
  const occ = event.occurrenceDates ?? [];
  if (occ.length > 1) {
    const display =
      ('occurrenceDisplayYmd' in event && event.occurrenceDisplayYmd) || occ[0];
    const firstLabel = formatUniversityEventDateInZone(`${display}T12:00:00`, timeZone, null);
    const extra = occ.length - 1;
    return `${firstLabel} + ${extra} date${extra === 1 ? '' : 's'}`;
  }
  return formatUniversityEventCardDateLine(event, timeZone);
}

/** One-line date for cards: range when start/end differ by day. */
export function formatUniversityEventCardDateLine(
  event: { startDate: string | null; endDate: string | null; rawDateText: string | null },
  timeZone: string,
): string {
  if (!event.startDate && !event.rawDateText?.trim()) return '';
  if (event.startDate && event.endDate) {
    const a = formatUniversityEventDateInZone(event.startDate, timeZone, null);
    const b = formatUniversityEventDateInZone(event.endDate, timeZone, null);
    const sameDay = event.startDate.slice(0, 10) === event.endDate.slice(0, 10);
    if (a && b && !sameDay) return `${a} – ${b}`;
  }
  return formatUniversityEventDateInZone(event.startDate, timeZone, event.rawDateText ?? null);
}
