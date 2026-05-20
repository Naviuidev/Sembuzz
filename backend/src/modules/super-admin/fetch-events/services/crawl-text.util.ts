import { createHash } from 'crypto';

export function sha256hex(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

/**
 * Shrink listing text before GPT: drop boilerplate-ish lines, collapse short repeats, hard cap length.
 */
export function condenseListingTextForGpt(text: string, maxChars: number): string {
  if (!text) return '';
  const lines = text.split('\n');
  const kept: string[] = [];
  let prev = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.length < 140 && line === prev) continue;
    prev = line;
    if (
      line.length < 200 &&
      /^(accept|agree)\s+/i.test(line) &&
      /cookie|privacy|terms/i.test(line)
    ) {
      continue;
    }
    if (line.length < 160 && /^(subscribe|sign up for our newsletter|follow us on)/i.test(line)) continue;
    kept.push(line);
  }
  let out = kept.join('\n');
  if (out.length > maxChars) {
    out = `${out.slice(0, maxChars)}\n[…truncated…]`;
  }
  return out;
}
