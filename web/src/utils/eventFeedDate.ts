/** Minutes east of UTC — pass as `tzOffset` when filtering by posted date on the API. */
export function getFeedDateFilterTzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/** Local calendar date YYYY-MM-DD (matches Inshorts feed date display). */
export function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Same timestamp source as InshortsHomeFeed `formatRelativeTime`. */
export function getEventFeedDateIso(event: {
  updatedAt: string;
  createdAt: string;
  publishedAt?: string | null;
}): string {
  return event.updatedAt || event.createdAt || event.publishedAt || '';
}

export function eventMatchesFeedDateYmd(
  event: { updatedAt: string; createdAt: string; publishedAt?: string | null },
  ymd: string,
): boolean {
  const iso = getEventFeedDateIso(event);
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return toYmdLocal(new Date(iso)) === ymd;
}

export type FeedDateFilterMode = 'combined' | 'event' | 'posted';

export type EventViewByDateFields = {
  eventDate?: string | null;
  publishAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
};

/** Event details date (YYYY-MM-DD) from API, stable across timezones. */
export function eventDateToYmd(eventDate: string | null | undefined): string | null {
  if (eventDate == null || String(eventDate).trim() === '') return null;
  const s = String(eventDate).trim();
  const head = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (head) return head[1];
  const t = new Date(s).getTime();
  if (Number.isNaN(t)) return null;
  return toYmdLocal(new Date(s));
}

/** When no event date: day the news was published (or created). */
export function getPostedDateYmd(event: EventViewByDateFields): string | null {
  const iso = event.publishedAt || event.createdAt || event.publishAt || '';
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return toYmdLocal(new Date(iso));
}

/**
 * Filter day for view-by-date:
 * 1) Event details date when set on the post
 * 2) Otherwise posted / created date
 */
export function getEventViewByDateYmd(event: EventViewByDateFields): string | null {
  const fromEvent = eventDateToYmd(event.eventDate);
  if (fromEvent) return fromEvent;
  return getPostedDateYmd(event);
}

export function eventMatchesViewByDateYmd(event: EventViewByDateFields, ymd: string): boolean {
  const day = getEventViewByDateYmd(event);
  return day === ymd;
}

export function eventMatchesEventDateYmd(event: EventViewByDateFields, ymd: string): boolean {
  const day = eventDateToYmd(event.eventDate);
  return day === ymd;
}

export function eventMatchesPostedDateYmd(event: EventViewByDateFields, ymd: string): boolean {
  return getPostedDateYmd(event) === ymd;
}

export function eventMatchesFeedDateByMode(
  event: EventViewByDateFields,
  ymd: string,
  mode: FeedDateFilterMode,
): boolean {
  if (mode === 'event') return eventMatchesEventDateYmd(event, ymd);
  if (mode === 'posted') return eventMatchesPostedDateYmd(event, ymd);
  return eventMatchesViewByDateYmd(event, ymd);
}

export function filterEventsByViewByDate<T extends EventViewByDateFields>(
  events: T[],
  ymd: string | null | undefined,
  mode: FeedDateFilterMode = 'combined',
): T[] {
  const d = typeof ymd === 'string' ? ymd.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return events;
  return events.filter((e) => eventMatchesFeedDateByMode(e, d, mode));
}

/** @deprecated Prefer getEventViewByDateYmd */
export function getEventViewByDateIso(event: EventViewByDateFields): string {
  const ymd = getEventViewByDateYmd(event);
  return ymd ? `${ymd}T12:00:00.000Z` : '';
}

/** @deprecated Prefer getEventViewByDateYmd */
export function getEventCalendarDateIso(event: EventViewByDateFields): string {
  return getEventViewByDateIso(event);
}

/** Match events by view-by-date rules (local timezone). */
export function eventMatchesCalendarDateYmd(event: EventViewByDateFields, ymd: string): boolean {
  return eventMatchesViewByDateYmd(event, ymd);
}

/** @deprecated Use eventMatchesCalendarDateYmd */
export function eventMatchesScheduledDateYmd(event: EventViewByDateFields, ymd: string): boolean {
  return eventMatchesCalendarDateYmd(event, ymd);
}
