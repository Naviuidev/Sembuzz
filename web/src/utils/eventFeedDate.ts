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

/** Date chosen when posting (publishAt), or when the post went live. */
export function getEventCalendarDateIso(event: {
  publishAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}): string {
  return event.publishAt || event.publishedAt || event.createdAt || '';
}

/** Match events by the calendar day set during posting (local timezone). */
export function eventMatchesCalendarDateYmd(
  event: { publishAt?: string | null; publishedAt?: string | null; createdAt: string },
  ymd: string,
): boolean {
  const iso = getEventCalendarDateIso(event);
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return toYmdLocal(new Date(iso)) === ymd;
}

/** @deprecated Use eventMatchesCalendarDateYmd */
export function eventMatchesScheduledDateYmd(
  event: { publishAt?: string | null; publishedAt?: string | null; createdAt: string },
  ymd: string,
): boolean {
  return eventMatchesCalendarDateYmd(event, ymd);
}
