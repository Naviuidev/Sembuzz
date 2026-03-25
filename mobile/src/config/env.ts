function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

/** Default when no `EXPO_PUBLIC_API_URL` is set (App Store / Play builds). */
export const PRODUCTION_API_BASE_URL = 'https://api.sembuzz.com';

/**
 * API origin for axios and `imageSrc` (`/uploads/*`).
 * - **Production / release:** omit `EXPO_PUBLIC_API_URL` → `https://api.sembuzz.com`.
 * - **Local dev (match web `VITE_API_URL`):** set e.g. `EXPO_PUBLIC_API_URL=http://localhost:3000`
 *   so the simulator uses the same backend as `localhost:5173`. iOS Simulator can reach host
 *   `localhost`; Android emulator usually needs `http://10.0.2.2:3000` instead of `localhost`.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }
  return PRODUCTION_API_BASE_URL;
}

export function getFrontendBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_FRONTEND_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  return 'https://sembuzz.com';
}
