export interface JsonPreviewEvent {
  id: string;
  title: string;
  university: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  venue: string | null;
  detailUrl: string | null;
  posterUrl: string | null;
  logoUrl: string | null;
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

function extractEventArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  for (const key of ['events', 'items', 'data', 'results', 'records']) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function extractDefaultLogo(data: unknown): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  return pickString(record, [
    'school_logo_url',
    'logoUrl',
    'logo',
    'sourceLogo',
    'universityLogo',
    'schoolLogo',
  ]);
}

function normalizeEvent(
  raw: unknown,
  index: number,
  defaultLogo: string | null,
): JsonPreviewEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const title = pickString(r, [
    'event_name',
    'title',
    'name',
    'eventTitle',
    'event_title',
  ]);
  if (!title) return null;

  const id =
    pickString(r, ['id', 'eventId', 'event_id']) ??
    pickString(r, ['event_url', 'canonical_url']) ??
    `json-event-${index + 1}`;

  const logoUrl =
    pickString(r, [
      'school_logo_url',
      'logoUrl',
      'logo',
      'schoolLogo',
      'universityLogo',
    ]) ?? defaultLogo;

  const posterUrl = pickString(r, [
    'event_poster_url',
    'posterUrl',
    'poster_url',
    'imageUrl',
    'image_url',
    'image',
    'thumbnail',
  ]);

  const startTime = pickString(r, [
    'event_start_time',
    'startTime',
    'start_time',
    'rawTimeText',
    'time',
  ]);
  const endTime = pickString(r, ['event_end_time', 'endTime', 'end_time']);

  return {
    id,
    title,
    university: pickString(r, ['university', 'school', 'schoolName', 'universityName']),
    description: pickString(r, [
      'event_description',
      'description',
      'summary',
      'details',
      'body',
    ]),
    startDate: pickString(r, [
      'event_start_date',
      'startDate',
      'start_date',
      'startDateUtc',
      'start',
    ]),
    endDate: pickString(r, [
      'event_end_date',
      'endDate',
      'end_date',
      'endDateUtc',
      'end',
    ]),
    startTime,
    endTime,
    allDay: pickBool(r, ['all_day', 'allDay']) || (!startTime && !endTime),
    venue: pickString(r, [
      'event_location',
      'venue',
      'location',
      'place',
    ]),
    detailUrl: pickString(r, [
      'event_url',
      'canonical_url',
      'detailUrl',
      'detail_url',
      'sourceUrl',
      'source_url',
      'url',
      'link',
      'registrationLink',
      'eventUrl',
    ]),
    posterUrl,
    logoUrl,
  };
}

/** Per-event card thumbnail: poster first, then school logo fallback. */
export function jsonEventCardImage(event: JsonPreviewEvent): string | null {
  return event.posterUrl ?? event.logoUrl;
}

export function parseJsonEventsText(text: string): {
  events: JsonPreviewEvent[];
  error: string | null;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { events: [], error: 'Invalid JSON — check file syntax.' };
  }

  const defaultLogo = extractDefaultLogo(parsed);
  const rawEvents = extractEventArray(parsed);
  if (rawEvents.length === 0) {
    return {
      events: [],
      error:
        'No events found. Use a JSON array or an object with an "events" (or "items") array.',
    };
  }

  const events = rawEvents
    .map((raw, i) => normalizeEvent(raw, i, defaultLogo))
    .filter((e): e is JsonPreviewEvent => e !== null);

  if (events.length === 0) {
    return {
      events: [],
      error: 'Found rows but none had event_name (or title).',
    };
  }

  return { events, error: null };
}

export async function parseJsonEventsFile(file: File): Promise<{
  events: JsonPreviewEvent[];
  error: string | null;
}> {
  const text = await file.text();
  return parseJsonEventsText(text);
}

/** Raw event objects from file (for API upload). */
export function extractRawEventsFromText(text: string): {
  events: Record<string, unknown>[];
  error: string | null;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { events: [], error: 'Invalid JSON — check file syntax.' };
  }
  const rawEvents = extractEventArray(parsed);
  if (!rawEvents.length) {
    return {
      events: [],
      error: 'No events found. Use a JSON array or an object with an "events" array.',
    };
  }
  return {
    events: rawEvents.filter(
      (r): r is Record<string, unknown> => !!r && typeof r === 'object' && !Array.isArray(r),
    ),
    error: null,
  };
}

export function apiGroupEventToPreview(e: {
  id: string;
  title: string;
  university?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  allDay?: boolean;
  venue?: string | null;
  detailUrl?: string | null;
  posterUrl?: string | null;
  logoUrl?: string | null;
}): JsonPreviewEvent {
  const ymd = (iso: string | null | undefined) =>
    iso ? iso.slice(0, 10) : null;
  return {
    id: e.id,
    title: e.title,
    university: e.university ?? null,
    description: e.description ?? null,
    startDate: ymd(e.startDate),
    endDate: ymd(e.endDate),
    startTime: e.startTime ?? null,
    endTime: e.endTime ?? null,
    allDay: Boolean(e.allDay),
    venue: e.venue ?? null,
    detailUrl: e.detailUrl ?? null,
    posterUrl: e.posterUrl ?? null,
    logoUrl: e.logoUrl ?? null,
  };
}

function parseYmd(ymd: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd.trim());
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatYmdLabel(ymd: string): string {
  const d = parseYmd(ymd);
  if (!d) return ymd;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatJsonEventDateLine(event: JsonPreviewEvent): string | null {
  if (!event.startDate && !event.endDate) return null;

  const startLabel = event.startDate ? formatYmdLabel(event.startDate) : null;
  const endLabel = event.endDate ? formatYmdLabel(event.endDate) : null;

  if (startLabel && endLabel && event.endDate !== event.startDate) {
    return `${startLabel} → ${endLabel}`;
  }
  return startLabel ?? endLabel;
}

export function formatJsonEventTimeLine(event: JsonPreviewEvent): string | null {
  if (event.allDay && !event.startTime && !event.endTime) {
    return 'All day';
  }
  if (event.startTime && event.endTime) {
    return `${event.startTime} – ${event.endTime}`;
  }
  if (event.startTime) return event.startTime;
  if (event.endTime) return event.endTime;
  return null;
}
