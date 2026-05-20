export interface ParsedSourceRow {
  universityName: string;
  url: string;
}

/**
 * Minimal RFC 4180-ish CSV row tokenizer. Handles:
 * - quoted fields with embedded commas
 * - escaped quotes ("")
 * - trailing/leading whitespace
 * Does NOT handle multi-line quoted fields (universities rarely need them).
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

/** Compact header key: matches "Website URL", "website_url", etc. */
export function headerKey(h: string): string {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** Prefer explicit events listing columns, then general site/home URLs (master roster format). */
const NAME_COLUMN_KEYS = [
  'universityname',
  'schoolname',
  'institution',
  'campusname',
  'collegename',
  'systemname',
  'name',
];

const EVENT_URL_COLUMN_KEYS = [
  'eventsurl',
  'eventspageurl',
  'eventpageurl',
  'eventlistingurl',
  'eventscalendarurl',
  'calendarurl',
  'eventslink',
];

const SITE_URL_COLUMN_KEYS = [
  'websiteurl',
  'homepageurl',
  'siteurl',
  'weburl',
  'url',
  'link',
  'website',
];

function pickNameColumnIndex(keys: string[]): number {
  for (const want of NAME_COLUMN_KEYS) {
    const i = keys.indexOf(want);
    if (i >= 0) return i;
  }
  return -1;
}

function pickUrlColumnIndex(keys: string[]): number {
  for (const want of EVENT_URL_COLUMN_KEYS) {
    const i = keys.indexOf(want);
    if (i >= 0) return i;
  }
  for (const want of SITE_URL_COLUMN_KEYS) {
    const i = keys.indexOf(want);
    if (i >= 0) return i;
  }
  return -1;
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function csvTextToMatrix(raw: string): string[][] {
  const text = raw.replace(/^\uFEFF/, '');
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines.map(splitCsvLine);
}

/**
 * Parse any roster shaped like `sembuzz_master_target_universities_expanded_systems`:
 * Category | System Name | University Name | State | Website URL | ...
 * Uses **University Name** + **Website URL** (or an Events URL column when present).
 */
export function parseUniversityMatrix(matrix: string[][]): ParsedSourceRow[] {
  if (matrix.length === 0) return [];

  const firstRow = matrix[0].map((c) => String(c ?? '').trim());
  const keys = firstRow.map(headerKey);

  const nameCol = pickNameColumnIndex(keys);
  const urlCol = pickUrlColumnIndex(keys);

  const looksLikeHeader =
    nameCol >= 0 ||
    urlCol >= 0 ||
    firstRow.every((c) => !isUrl(c));

  let nameIdx = nameCol >= 0 ? nameCol : 0;
  let urlIdx = urlCol >= 0 ? urlCol : Math.min(1, Math.max(0, firstRow.length - 1));
  let startRow = 0;

  if (looksLikeHeader && (nameCol >= 0 || urlCol >= 0)) {
    startRow = 1;
    if (nameCol >= 0) nameIdx = nameCol;
    if (urlCol >= 0) urlIdx = urlCol;
  } else if (looksLikeHeader) {
    startRow = 1;
  }

  const rows: ParsedSourceRow[] = [];
  const seen = new Set<string>();

  for (let r = startRow; r < matrix.length; r++) {
    const cells = matrix[r] || [];
    const pad = (i: number) => String(cells[i] ?? '').trim();

    let name = pad(nameIdx);
    let url = pad(urlIdx);

    if (!url && isUrl(name)) {
      url = name;
      name = '';
    }
    if (!isUrl(url) && isUrl(name)) {
      const t = url;
      url = name;
      name = t;
    }

    if (!isUrl(url)) continue;
    if (!name) {
      try {
        name = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        name = url;
      }
    }

    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({ universityName: name.slice(0, 500), url: url.slice(0, 2048) });
  }

  return rows;
}

export function parseUniversityCsv(raw: string): ParsedSourceRow[] {
  return parseUniversityMatrix(csvTextToMatrix(raw));
}
