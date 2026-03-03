const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Resolve image URL for display. Relative paths are assumed to be under backend /uploads/.
 * Use for school logos, event images, etc.
 */
export function imageSrc(url: string | null | undefined): string {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return '';
  // Inline base64 (e.g. school logo stored as data URL)
  if (u.startsWith('data:')) return u;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = API_BASE.replace(/\/$/, '');
  let path = u.startsWith('/') ? u : `/${u}`;
  // Backend serves uploads at /uploads/; paths stored without prefix need it
  if (!path.startsWith('/uploads')) path = `/uploads${path.startsWith('/') ? path : `/${path}`}`;
  return `${base}${path}`;
}
