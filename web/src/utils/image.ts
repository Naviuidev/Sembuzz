import { getAssetBaseUrl } from '../config/apiBase';

/** Strip accidental JSON quotes from stored URLs */
function stripQuotes(raw: string): string {
  let v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/**
 * Resolve image URL for display.
 * - Paths under /uploads use `getAssetBaseUrl()` (see `VITE_ASSET_BASE_URL` when API is local).
 * - Other https URLs (e.g. external CDNs) are left unchanged.
 */
export function imageSrc(url: string | null | undefined): string {
  const u = stripQuotes(typeof url === 'string' ? url : '');
  if (!u) return '';
  if (u.startsWith('data:')) return u;

  const base = getAssetBaseUrl().replace(/\/$/, '');

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
