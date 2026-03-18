/** MySQL TEXT ≈ 65,535 bytes; stay under to avoid insert failures (UTF-8 multi-byte). */
export function clipForMysqlText(s: string, maxBytes = 62000): string {
  if (!s) return s;
  if (Buffer.byteLength(s, 'utf8') <= maxBytes) return s;
  let lo = 0;
  let hi = s.length;
  while (lo < hi) {
    const mid = lo + Math.ceil((hi - lo) / 2);
    if (Buffer.byteLength(s.slice(0, mid), 'utf8') <= maxBytes) lo = mid;
    else hi = mid - 1;
  }
  return s.slice(0, lo);
}

/** Sanitize and persist blog contentBlocks JSON; matches public reader types. */

export type SanitizedBlock =
  | { type: 'heading'; value: string; cols: number }
  | { type: 'paragraph'; value: string; cols: number }
  | { type: 'image'; imageUrl: string; cols: number; alt?: string }
  | {
      type: 'heading_para';
      heading: string;
      paragraph: string;
      cols: number;
    };

const MAX_BLOCKS = 50;
const MAX_STR = 20000;
const MAX_HEADING = 500;
const MAX_ALT = 200;

function clampCols(c: unknown): number {
  const n = Number(c);
  if (!Number.isFinite(n)) return 12;
  return Math.min(12, Math.max(1, Math.round(n)));
}

export function sanitizeContentBlocks(raw: unknown): SanitizedBlock[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: SanitizedBlock[] = [];
  for (const item of raw.slice(0, MAX_BLOCKS)) {
    if (!item || typeof item !== 'object') continue;
    const b = item as Record<string, unknown>;
    const cols = clampCols(b.cols);
    if (b.type === 'heading' && typeof b.value === 'string') {
      const v = b.value.trim().slice(0, MAX_HEADING);
      if (v) out.push({ type: 'heading', value: v, cols });
    } else if (b.type === 'paragraph' && typeof b.value === 'string') {
      const v = b.value.trim().slice(0, MAX_STR);
      if (v) out.push({ type: 'paragraph', value: v, cols });
    } else if (b.type === 'image' && typeof b.imageUrl === 'string') {
      const url = b.imageUrl.trim().slice(0, 2048);
      if (
        url &&
        (url.startsWith('http://') ||
          url.startsWith('https://') ||
          url.startsWith('/uploads/'))
      ) {
        const alt =
          typeof b.alt === 'string' ? b.alt.trim().slice(0, MAX_ALT) : undefined;
        out.push({ type: 'image', imageUrl: url, cols, alt });
      }
    } else if (b.type === 'heading_para') {
      const h =
        typeof b.heading === 'string'
          ? b.heading.trim().slice(0, MAX_HEADING)
          : '';
      const p =
        typeof b.paragraph === 'string'
          ? b.paragraph.trim().slice(0, MAX_STR)
          : '';
      if (h || p) out.push({ type: 'heading_para', heading: h, paragraph: p, cols });
    }
  }
  return out.length ? out : null;
}

export function blocksHaveText(blocks: SanitizedBlock[] | null): boolean {
  if (!blocks) return false;
  for (const b of blocks) {
    if (b.type === 'paragraph' && b.value.trim()) return true;
    if (b.type === 'heading' && b.value.trim()) return true;
    if (
      b.type === 'heading_para' &&
      (b.heading.trim() || b.paragraph.trim())
    )
      return true;
  }
  return false;
}

export function extractTextFromBlocks(blocks: SanitizedBlock[] | null): string {
  if (!blocks) return '';
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === 'paragraph') parts.push(b.value);
    if (b.type === 'heading') parts.push(b.value);
    if (b.type === 'heading_para') {
      if (b.heading) parts.push(b.heading);
      if (b.paragraph) parts.push(b.paragraph);
    }
  }
  return parts.join('\n\n').trim();
}
