/** Canonical URL for the public events feed (site index). */
export const PUBLIC_EVENTS_PATH = '/';

export function isPublicEventsPath(pathname: string): boolean {
  return pathname === PUBLIC_EVENTS_PATH || pathname === '/events';
}
