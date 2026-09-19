import { BadRequestException } from '@nestjs/common';

export type EventActionButtonInput = { label: string; url: string };

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MAX_LOCATION_LEN = 500;
const MAX_ACTION_BUTTONS = 12;
const MAX_LABEL_LEN = 120;
const MAX_URL_LEN = 2000;

/** Parse YYYY-MM-DD as a calendar date (noon UTC) so the stored DATE is stable. */
export function parseEventDateYmd(value: string | undefined | null): Date | null {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return null;
  if (!YMD.test(s)) {
    throw new BadRequestException('eventDate must be YYYY-MM-DD.');
  }
  const d = new Date(`${s}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException('eventDate is not a valid date.');
  }
  return d;
}

/** Normalize optional HH:mm from HTML time inputs. */
export function parseEventTimeHm(value: string | undefined | null): string | null {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return null;
  if (!HM.test(s)) {
    throw new BadRequestException('Event time must be HH:mm (24-hour).');
  }
  return s;
}

export function normalizeEventLocation(value: string | undefined | null): string | null {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return null;
  if (s.length > MAX_LOCATION_LEN) {
    throw new BadRequestException(`Event location must be at most ${MAX_LOCATION_LEN} characters.`);
  }
  return s;
}

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Normalize and validate action buttons; returns JSON string or null. */
export function serializeActionButtons(
  raw: EventActionButtonInput[] | undefined | null,
): string | null {
  if (!raw?.length) return null;
  if (raw.length > MAX_ACTION_BUTTONS) {
    throw new BadRequestException(`At most ${MAX_ACTION_BUTTONS} action buttons allowed.`);
  }
  const out: EventActionButtonInput[] = [];
  for (const row of raw) {
    const label = (row.label ?? '').trim();
    const url = (row.url ?? '').trim();
    if (!label && !url) continue;
    if (!label || !url) {
      throw new BadRequestException('Each action button needs both a label and a URL.');
    }
    if (label.length > MAX_LABEL_LEN) {
      throw new BadRequestException(`Action button label must be at most ${MAX_LABEL_LEN} characters.`);
    }
    if (url.length > MAX_URL_LEN || !isHttpUrl(url)) {
      throw new BadRequestException('Each action button URL must be a valid http(s) link.');
    }
    out.push({ label, url });
  }
  return out.length ? JSON.stringify(out) : null;
}

export function parseActionButtonsJson(
  stored: string | null | undefined,
): EventActionButtonInput[] {
  if (!stored?.trim()) return [];
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => ({
        label: typeof row?.label === 'string' ? row.label : '',
        url: typeof row?.url === 'string' ? row.url : '',
      }))
      .filter((b) => b.label && b.url);
  } catch {
    return [];
  }
}
