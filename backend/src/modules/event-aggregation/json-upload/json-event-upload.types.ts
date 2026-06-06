export type JsonUploadRawEvent = Record<string, unknown>;

export interface NormalizedJsonUploadEvent {
  universityName: string;
  calendarUrl: string;
  logoUrl: string | null;
  title: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  venue: string | null;
  detailUrl: string | null;
  posterUrl: string | null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function pickBool(obj: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const v = obj[key];
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
  }
  return false;
}

export function parseYmdToDate(ymd: string | null): Date | null {
  if (!ymd?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd.trim());
  if (!match) return null;
  const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function normalizeJsonUploadEvent(raw: JsonUploadRawEvent): NormalizedJsonUploadEvent | null {
  const title = pickString(raw, ['event_name', 'title', 'name', 'eventTitle']);
  if (!title) return null;

  const universityName =
    pickString(raw, ['university', 'school', 'schoolName', 'universityName']) ?? 'University';
  const calendarUrl =
    pickString(raw, ['calendar_url', 'calendarUrl', 'url']) ??
    pickString(raw, ['event_url', 'canonical_url']) ??
    'https://example.com';
  const logoUrl = pickString(raw, ['school_logo_url', 'logoUrl', 'logo']);
  const posterUrl = pickString(raw, ['event_poster_url', 'posterUrl', 'imageUrl', 'image']);
  const startTime = pickString(raw, ['event_start_time', 'startTime', 'time']);
  const endTime = pickString(raw, ['event_end_time', 'endTime']);
  const allDay = pickBool(raw, ['all_day', 'allDay']) || (!startTime && !endTime);

  return {
    universityName,
    calendarUrl,
    logoUrl,
    title,
    description: pickString(raw, ['event_description', 'description', 'summary']),
    startDate: parseYmdToDate(pickString(raw, ['event_start_date', 'startDate', 'start_date'])),
    endDate: parseYmdToDate(pickString(raw, ['event_end_date', 'endDate', 'end_date'])),
    startTime,
    endTime,
    allDay,
    venue: pickString(raw, ['event_location', 'venue', 'location']),
    detailUrl: pickString(raw, ['event_url', 'canonical_url', 'detailUrl', 'url', 'link']),
    posterUrl,
  };
}

export function groupKey(universityName: string, calendarUrl: string): string {
  return `${universityName.trim().toLowerCase()}|${calendarUrl.trim().toLowerCase()}`;
}
