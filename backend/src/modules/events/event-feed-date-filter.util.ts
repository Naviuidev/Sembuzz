import type { Prisma } from '@prisma/client';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export type PublicFeedDateFilterMode = 'combined' | 'event' | 'posted';

/** Same meaning as `Date.getTimezoneOffset()` negated: minutes east of UTC (e.g. IST = 330). */
export function parseFeedDateTzOffsetMinutes(raw: string | undefined): number {
  if (raw == null || String(raw).trim() === '') return 0;
  const n = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-720, Math.min(840, n));
}

export function parsePublicFeedDateFilterMode(raw: string | undefined): PublicFeedDateFilterMode {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (s === 'event') return 'event';
  if (s === 'posted') return 'posted';
  return 'combined';
}

/** UTC instants for local calendar day `ymd` in the given offset (matches client `toYmdLocal`). */
export function localCalendarDayUtcBounds(
  ymd: string,
  tzOffsetMinutes: number,
): { dayStart: Date; dayEnd: Date } {
  const [y, m, d] = ymd.split('-').map(Number);
  const toUtc = (h: number, min: number, s: number, ms: number) =>
    new Date(Date.UTC(y, m - 1, d, h, min, s, ms) - tzOffsetMinutes * 60_000);
  return {
    dayStart: toUtc(0, 0, 0, 0),
    dayEnd: toUtc(23, 59, 59, 999),
  };
}

/**
 * Public feed date filter (single selected day).
 * - combined (guest calendar): event date when set, else posted date
 * - event: only posts with Event details date on that day
 * - posted: only by publishedAt / createdAt (organization post date)
 */
export function buildPublicFeedDateWhere(
  ymd: string,
  tzOffsetMinutes = 0,
  mode: PublicFeedDateFilterMode = 'combined',
): Prisma.EventWhereInput | undefined {
  const date = typeof ymd === 'string' ? ymd.trim() : '';
  if (!YMD.test(date)) return undefined;

  const eventDayStart = new Date(`${date}T00:00:00.000Z`);
  const eventDayEnd = new Date(`${date}T23:59:59.999Z`);
  const { dayStart: postedDayStart, dayEnd: postedDayEnd } = localCalendarDayUtcBounds(
    date,
    tzOffsetMinutes,
  );

  const eventDateWhere: Prisma.EventWhereInput = {
    eventDate: { gte: eventDayStart, lte: eventDayEnd },
  };

  const postedDayOr: Prisma.EventWhereInput[] = [
    { publishedAt: { gte: postedDayStart, lte: postedDayEnd } },
    {
      AND: [{ publishedAt: null }, { createdAt: { gte: postedDayStart, lte: postedDayEnd } }],
    },
  ];

  if (mode === 'event') return eventDateWhere;

  if (mode === 'posted') return { OR: postedDayOr };

  return {
    OR: [eventDateWhere, { eventDate: null, OR: postedDayOr }],
  };
}
