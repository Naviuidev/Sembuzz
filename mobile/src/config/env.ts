function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

/** Default when no `EXPO_PUBLIC_API_URL` is set (App Store / Play builds). */
export const PRODUCTION_API_BASE_URL = 'https://api.sembuzz.com';

/**
 * API origin for axios (JSON, auth, etc.).
 * - **Production / release:** omit `EXPO_PUBLIC_API_URL` → `https://api.sembuzz.com`.
 * - **Local dev:** e.g. `EXPO_PUBLIC_API_URL=http://localhost:3000` (iOS Simulator) or
 *   `http://10.0.2.2:3000` (Android emulator).
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }
  return PRODUCTION_API_BASE_URL;
}

/**
 * Base URL for static files under `/uploads/*` (see `imageSrc`).
 * When unset, matches `getApiBaseUrl()`. Set to production when your API points at localhost
 * but posts/images were uploaded to production — otherwise every image URL becomes
 * `http://localhost:3000/uploads/...` and files are missing locally.
 */
export function getAssetBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_ASSET_BASE_URL?.trim();
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }
  return getApiBaseUrl();
}

export function getFrontendBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_FRONTEND_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  return 'https://sembuzz.com';
}
