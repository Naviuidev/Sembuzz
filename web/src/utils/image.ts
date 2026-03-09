// Match backend api.ts so uploads resolve to the same origin as API calls
function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim().replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin === 'https://sembuzz.com' || origin === 'https://www.sembuzz.com') return 'https://api.sembuzz.com';
  }
  return 'http://localhost:3000';
}

const API_BASE = getApiBase();

/**
 * Resolve image URL for display. Relative paths are assumed to be under backend /uploads/.
 * Absolute URLs under /uploads/ are rewritten to use current API base so images work in local dev.
 */
export function imageSrc(url: string | null | undefined): string {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return '';
  // Inline base64 (e.g. school logo stored as data URL)
  if (u.startsWith('data:')) return u;
  const base = API_BASE.replace(/\/$/, '');
  // Absolute URL: if it's an upload path, resolve against current API so local dev works
  if (u.startsWith('http://') || u.startsWith('https://')) {
    try {
      const parsed = new URL(u);
      if (parsed.pathname.startsWith('/uploads/')) return `${base}${parsed.pathname}`;
    } catch {
      // ignore
    }
    return u;
  }
  let path = u.startsWith('/') ? u : `/${u}`;
  if (!path.startsWith('/uploads')) path = `/uploads${path.startsWith('/') ? path : `/${path}`}`;
  return `${base}${path}`;
}
