/** Matches backend default `UNIVERSITY_EVENTS_TIMEZONE` when the API omits a zone. */
export const DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ = 'America/New_York';

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
