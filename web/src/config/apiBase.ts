/**
 * Single source of truth for backend API origin (axios + image URLs for /uploads).
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim() ?? '';
  if (raw && raw !== '/') {
    const url = raw.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      try {
        const apiOrigin = new URL(url, window.location.origin).origin;
        if (
          window.location.port === '5173' &&
          apiOrigin === window.location.origin
        ) {
          return 'http://localhost:3000';
        }
      } catch {
        /* use url */
      }
      return url;
    }
    return url;
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (
      origin === 'https://sembuzz.com' ||
      origin === 'https://www.sembuzz.com' ||
      origin === 'http://sembuzz.com' ||
      origin === 'http://www.sembuzz.com'
    ) {
      return 'https://api.sembuzz.com';
    }
  }
  return 'http://localhost:3000';
}
