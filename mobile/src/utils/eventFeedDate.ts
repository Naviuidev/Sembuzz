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
  updatedAt?: string | null;
};

export function eventDateToYmd(eventDate: string | null | undefined): string | null {
  if (eventDate == null || String(eventDate).trim() === '') return null;
  const s = String(eventDate).trim();
  const head = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (head) return head[1];
  const t = new Date(s).getTime();
  if (Number.isNaN(t)) return null;
  return toYmdLocal(new Date(s));
}

export function getPostedDateYmd(event: EventViewByDateFields): string | null {
  const iso = event.publishedAt || event.createdAt || event.publishAt || event.updatedAt || '';
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return toYmdLocal(new Date(iso));
}

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

/** Distinct YYYY-MM-DD values that have at least one post for the given filter mode. */
export function collectFeedDatesByMode(
  events: EventViewByDateFields[],
  mode: 'event' | 'posted',
): Set<string> {
  const dates = new Set<string>();
  for (const event of events) {
    const ymd = mode === 'event' ? eventDateToYmd(event.eventDate) : getPostedDateYmd(event);
    if (ymd) dates.add(ymd);
  }
  return dates;
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

export function getEventCalendarDateIso(event: EventViewByDateFields): string {
  const ymd = getEventViewByDateYmd(event);
  return ymd ? `${ymd}T12:00:00.000Z` : '';
}

export function eventMatchesCalendarDateYmd(event: EventViewByDateFields, ymd: string): boolean {
  return eventMatchesViewByDateYmd(event, ymd);
}

export function eventMatchesScheduledDateYmd(event: EventViewByDateFields, ymd: string): boolean {
  return eventMatchesCalendarDateYmd(event, ymd);
}

export function getTodayYmdLocal(now = new Date()): string {
  return toYmdLocal(now);
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toYmdLocal(dt);
}

export function formatEventDateHeroPillLabel(
  ymd: string | null | undefined,
  todayYmd = getTodayYmdLocal(),
): string | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  const base = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const tomorrow = addDaysYmd(todayYmd, 1);
  if (ymd === todayYmd) return `Today · ${base}`;
  if (ymd === tomorrow) return `Tomorrow · ${base}`;
  return base;
}

type ChronologicalFeedSortable = EventViewByDateFields & { createdAt: string };

export function getFeedSortBucketYmd(event: EventViewByDateFields): string | null {
  const eventDay = eventDateToYmd(event.eventDate);
  if (eventDay) return eventDay;
  return getPostedDateYmd(event);
}

export function getFeedSortWithinDayRank(event: EventViewByDateFields, bucketYmd: string): number {
  const eventDay = eventDateToYmd(event.eventDate);
  if (eventDay === bucketYmd) return 0;
  return 1;
}

export function compareEventsChronologicalByEventDate(
  a: ChronologicalFeedSortable,
  b: ChronologicalFeedSortable,
  todayYmd = getTodayYmdLocal(),
): number {
  const bucketA = getFeedSortBucketYmd(a);
  const bucketB = getFeedSortBucketYmd(b);

  if (!bucketA && !bucketB) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
  if (!bucketA) return 1;
  if (!bucketB) return -1;

  const era = (ymd: string): number => (ymd >= todayYmd ? 0 : 1);
  const eraA = era(bucketA);
  const eraB = era(bucketB);
  if (eraA !== eraB) return eraA - eraB;

  if (eraA === 0) {
    const cmp = bucketA.localeCompare(bucketB);
    if (cmp !== 0) return cmp;
  } else {
    const cmp = bucketB.localeCompare(bucketA);
    if (cmp !== 0) return cmp;
  }

  const rankA = getFeedSortWithinDayRank(a, bucketA);
  const rankB = getFeedSortWithinDayRank(b, bucketB);
  if (rankA !== rankB) return rankA - rankB;

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function sortEventsChronologicalByEventDate<T extends ChronologicalFeedSortable>(
  events: T[],
  todayYmd = getTodayYmdLocal(),
): T[] {
  return [...events].sort((a, b) => compareEventsChronologicalByEventDate(a, b, todayYmd));
}

/** Home feed without a calendar day picked: today forward only. */
export function filterEventsHomeFeedFromToday<T extends EventViewByDateFields>(
  events: T[],
  todayYmd = getTodayYmdLocal(),
): T[] {
  return events.filter((e) => {
    const bucket = getFeedSortBucketYmd(e);
    return bucket != null && bucket >= todayYmd;
  });
}

export function sortEventsForHomeFeed<T extends ChronologicalFeedSortable & { id: string }>(
  events: T[],
  options: {
    feedSort: 'latest' | 'popular';
    todayYmd?: string;
    engagementScore?: (eventId: string) => number;
  },
): T[] {
  const todayYmd = options.todayYmd ?? getTodayYmdLocal();
  const score = options.engagementScore ?? (() => 0);

  if (options.feedSort === 'latest') {
    return sortEventsChronologicalByEventDate(events, todayYmd);
  }

  return [...events].sort((a, b) => {
    const chrono = compareEventsChronologicalByEventDate(a, b, todayYmd);
    if (chrono !== 0) return chrono;
    const diff = score(b.id) - score(a.id);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
