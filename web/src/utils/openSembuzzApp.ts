/**
 * After web login/signup on a phone browser, open the native SemBuzz app with the same session.
 * The app must handle `sembuzz://auth?token=<jwt>` (see mobile AuthContext).
 *
 * Note: JWTs in URLs are visible in browser history; prefer short-lived tokens in production.
 */

const SCHEME = 'sembuzz';

export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/** Opens the SemBuzz app with bearer token so the user stays signed in. No-op on desktop. */
export function openSembuzzAppWithToken(accessToken: string): void {
  if (!accessToken || !isMobileBrowser()) return;
  try {
    const url = `${SCHEME}://auth?token=${encodeURIComponent(accessToken)}`;
    window.location.assign(url);
  } catch {
    // ignore
  }
}
