function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

/** Single origin for REST API and `/uploads/*` image URLs — production only. */
export const PRODUCTION_API_BASE_URL = 'https://api.sembuzz.com';

/**
 * Always returns production API. Do not use localhost or env overrides — they break images
 * on devices/emulators and are easy to misconfigure.
 */
export function getApiBaseUrl(): string {
  return PRODUCTION_API_BASE_URL;
}

export function getFrontendBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_FRONTEND_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  return 'https://sembuzz.com';
}
