import { getApiBaseUrl } from '../config/apiBase';

/**
 * Resolve image URL for display. Relative paths are assumed to be under backend /uploads/.
 * Uses the same API base as axios so /uploads/* always hit the Nest server (e.g. api.sembuzz.com).
 */
export function imageSrc(url: string | null | undefined): string {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return '';
  if (u.startsWith('data:')) return u;

  const base = getApiBaseUrl().replace(/\/$/, '');

  if (u.startsWith('http://') || u.startsWith('https://')) {
    try {
      const parsed = new URL(u);
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${base}${parsed.pathname}${parsed.search || ''}`;
      }
    } catch {
      /* fall through */
    }
    return u;
  }
  let path = u.startsWith('/') ? u : `/${u}`;
  if (!path.startsWith('/uploads')) path = `/uploads${path.startsWith('/') ? path : `/${path}`}`;
  return `${base}${path}`;
}
