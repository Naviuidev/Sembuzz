import type { EventActionButtonStored } from '../types/event-post';

export const EVENT_DESCRIPTION_MAX_WORDS = 45;

export function truncateWords(text: string, maxWords: number): { text: string; truncated: boolean } {
  const trimmed = text.trim();
  if (!trimmed) return { text: '', truncated: false };
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return { text: trimmed, truncated: false };
  return { text: `${words.slice(0, maxWords).join(' ')}…`, truncated: true };
}

export function parseEventActionButtonsPublic(
  stored: string | null | undefined,
): EventActionButtonStored[] {
  if (!stored?.trim()) return [];
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => ({
        label: typeof row?.label === 'string' ? row.label.trim() : '',
        url: typeof row?.url === 'string' ? row.url.trim() : '',
      }))
      .filter((b) => b.label && b.url);
  } catch {
    return [];
  }
}

function formatHmDisplay(hm: string): string {
  const [hStr, mStr] = hm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatEventTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const s = typeof start === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(start.trim()) ? start.trim() : '';
  const e = typeof end === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(end.trim()) ? end.trim() : '';
  if (s && e) return `${formatHmDisplay(s)} – ${formatHmDisplay(e)}`;
  if (s) return formatHmDisplay(s);
  if (e) return formatHmDisplay(e);
  return null;
}

export function formatEventOccurrenceDate(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const ymd = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Card-style date e.g. Apr 24, 2026 */
export function formatEventOccurrenceDateShort(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const ymd = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseHmToMinutes(hm: string): number | null {
  const m = hm.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function formatEventDuration(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const s = typeof start === 'string' ? parseHmToMinutes(start) : null;
  const e = typeof end === 'string' ? parseHmToMinutes(end) : null;
  if (s == null || e == null || e <= s) return null;
  const mins = e - s;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  if (h > 0 && r > 0) return `(${h} hr ${r} min)`;
  if (h > 0) return h === 1 ? '(1 hr)' : `(${h} hr)`;
  return `(${r} min)`;
}

export function eventPostHasScheduleMeta(event: {
  eventDate?: string | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  eventLocation?: string | null;
}): boolean {
  return !!(
    formatEventOccurrenceDateShort(event.eventDate ?? null) ||
    formatEventTimeRange(event.eventStartTime, event.eventEndTime) ||
    event.eventLocation?.trim()
  );
}

export function eventPostHasActionButtons(event: { actionButtons?: string | null }): boolean {
  return parseEventActionButtonsPublic(event.actionButtons).length > 0;
}

export function eventPostHasPublicMeta(
  event: {
    eventDate?: string | null;
    eventStartTime?: string | null;
    eventEndTime?: string | null;
    eventLocation?: string | null;
    actionButtons?: string | null;
    externalLink?: string | null;
  },
): boolean {
  return !!(
    eventPostHasScheduleMeta(event) ||
    event.externalLink?.trim() ||
    eventPostHasActionButtons(event)
  );
}
