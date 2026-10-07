export function truncateToWords(text: string, maxWords: number): { excerpt: string; truncated: boolean } {
  const trimmed = text.trim();
  if (!trimmed) return { excerpt: '', truncated: false };
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return { excerpt: trimmed, truncated: false };
  return { excerpt: `${words.slice(0, maxWords).join(' ')}…`, truncated: true };
}
