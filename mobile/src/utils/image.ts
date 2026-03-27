import { getAssetBaseUrl } from '../config/env';

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

/**
 * Club/social icon field: uploaded files are stored as `/uploads/...` (or `http(s)`).
 * Bootstrap (`bi-*`) / Font Awesome (`fa-*`) are not image URLs.
 */
export function isImageIconValue(icon: string | null | undefined): boolean {
  const t = stripQuotes(typeof icon === 'string' ? icon : '');
  if (!t) return false;
  if (/^bi-/i.test(t) || /^fa-/.test(t) || /^fa\s/i.test(t)) return false;
  if (t.startsWith('http://') || t.startsWith('https://')) return true;
  if (t.startsWith('/uploads') || t.startsWith('uploads/')) return true;
  return /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(t);
}
