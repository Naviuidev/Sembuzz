import type { ApprovedEventPublic } from '../services/public-events.service';
import type { EventActionButtonStored } from '../types/event-post';
import { imageSrc } from './image';

export const EVENT_DESCRIPTION_MAX_WORDS = 60;

export function parseEventImageUrls(imageUrls: string | null | undefined): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls) as unknown;
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

/** Teaser (up to 60 words) + optional “About the Event” remainder. */
export function splitEventDescription(text: string): { teaser: string; about: string | null } {
  const trimmed = text.trim();
  if (!trimmed) return { teaser: '', about: null };
  const words = trimmed.split(/\s+/);
  if (words.length <= EVENT_DESCRIPTION_MAX_WORDS) {
    return { teaser: trimmed, about: null };
  }
  return {
    teaser: words.slice(0, EVENT_DESCRIPTION_MAX_WORDS).join(' '),
    about: words.slice(EVENT_DESCRIPTION_MAX_WORDS).join(' '),
  };
}

export function truncateWords(text: string, maxWords: number): { text: string; truncated: boolean } {
  const trimmed = text.trim();
  if (!trimmed) return { text: '', truncated: false };
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return { text: trimmed, truncated: false };
  return { text: `${words.slice(0, maxWords).join(' ')}…`, truncated: true };
}

/** Labels like “Know more” / typos (“Know Morw”) — render as compact link pill, not full-width CTA. */
export function isKnowMoreActionLabel(label: string): boolean {
  const norm = label.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!norm) return false;
  if (norm === 'know more' || norm === 'learn more' || norm === 'read more') return true;
  if (/^know\s+m[o0]r[eew]?$/.test(norm)) return true;
  if (norm.startsWith('know mor')) return true;
  return false;
}

export function knowMoreActionDisplayLabel(_label: string): string {
  return 'Know more';
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

export function mergeEventActionButtonsWithExternalLink(
  actionButtonsJson: string | null | undefined,
  externalLink: string | null | undefined,
): EventActionButtonStored[] {
  const buttons = parseEventActionButtonsPublic(actionButtonsJson);
  const ext = externalLink?.trim();
  if (!ext) return buttons;
  if (buttons.some((b) => b.url === ext)) return buttons;
  if (buttons.some((b) => isKnowMoreActionLabel(b.label))) return buttons;
  return [...buttons, { label: 'Know more', url: ext }];
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

/** Props for `CreatePostLivePreview` — matches school/category admin create-post web preview. */
export function approvedEventToCreatePostPreview(event: ApprovedEventPublic) {
  const imgs = parseEventImageUrls(event.imageUrls);
  const coverSrc = imgs[0] ? imageSrc(imgs[0]) : '';
  const rawDate = event.eventDate;
  const eventDate =
    rawDate && typeof rawDate === 'string' ? rawDate.slice(0, 10) : '';

  return {
    title: event.title,
    description: event.description ?? '',
    categoryName: '',
    subCategoryName: event.subCategory?.name ?? '',
    schoolName: event.school?.name,
    schoolLogoUrl: event.school?.image ?? null,
    eventDate,
    eventStartTime: event.eventStartTime ?? '',
    eventEndTime: event.eventEndTime ?? '',
    eventLocation: event.eventLocation ?? '',
    actionButtons: mergeEventActionButtonsWithExternalLink(
      event.actionButtons,
      event.externalLink,
    ),
    coverSrc,
    previewMode: 'web' as const,
    commentsEnabled: event.commentsEnabled,
  };
}
