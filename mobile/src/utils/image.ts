import { getApiBaseUrl } from '../config/env';

function stripQuotes(raw: string): string {
  let v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/**
 * Same as web: /uploads/* always resolved against API base (fixes banner URLs stored with wrong host).
 * Other https URLs unchanged.
 */
export function imageSrc(url: string | null | undefined): string {
  const u = stripQuotes(typeof url === 'string' ? url : '');
  if (!u) return '';
  if (u.startsWith('data:')) return u;

  const base = getApiBaseUrl().replace(/\/$/, '');

  if (u.startsWith('http://') || u.startsWith('https://')) {
    try {
      const parsed = new URL(u);
      if (parsed.pathname.startsWith('/uploads')) {
        return `${base}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      /* invalid URL */
    }
    return u;
  }

  let path = u.startsWith('/') ? u : `/${u}`;
  if (!path.startsWith('/uploads')) {
    path = `/uploads${path}`;
  }
  return `${base}${path}`;
}
