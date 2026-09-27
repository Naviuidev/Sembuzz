/** Feature codes selected on Super Admin → Create School; drive school-admin messaging pipeline. */
export const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';
export const INDIVIDUAL_MESSAGING_CODE = 'INDIVIDUAL_MESSAGING';
export const FILTERS_CODE = 'FILTERS';

export const MESSAGING_FEATURE_CODES = [
  GROUP_MESSAGING_CODE,
  INDIVIDUAL_MESSAGING_CODE,
  FILTERS_CODE,
] as const;

export type MessagingFeatureCode = (typeof MESSAGING_FEATURE_CODES)[number];

export function schoolHasMessagingFeature(
  features: Array<{ code: string }> | undefined,
): boolean {
  if (!features?.length) return false;
  return features.some((f) =>
    MESSAGING_FEATURE_CODES.includes(f.code as MessagingFeatureCode),
  );
}

export function schoolHasGroupMessaging(
  features: Array<{ code: string }> | undefined,
): boolean {
  return Boolean(features?.some((f) => f.code === GROUP_MESSAGING_CODE));
}

export function schoolHasIndividualMessaging(
  features: Array<{ code: string }> | undefined,
): boolean {
  return Boolean(features?.some((f) => f.code === INDIVIDUAL_MESSAGING_CODE));
}

export function schoolHasFiltersFeature(
  features: Array<{ code: string }> | undefined,
): boolean {
  return Boolean(features?.some((f) => f.code === FILTERS_CODE));
}

export type FiltersVisibility = 'BEFORE_LOGIN' | 'AFTER_LOGIN' | 'BOTH';

export const FILTERS_VISIBILITY_OPTIONS: { value: FiltersVisibility; label: string }[] = [
  { value: 'BEFORE_LOGIN', label: 'Only before login (guests)' },
  { value: 'AFTER_LOGIN', label: 'Only after login (students)' },
  { value: 'BOTH', label: 'Both before and after login' },
];

export function shouldShowSchoolFilterUi(
  filtersEnabled: boolean,
  visibility: FiltersVisibility | null | undefined,
  isLoggedIn: boolean,
): boolean {
  if (!filtersEnabled || !visibility) return false;
  if (visibility === 'BOTH') return true;
  if (visibility === 'BEFORE_LOGIN') return !isLoggedIn;
  if (visibility === 'AFTER_LOGIN') return isLoggedIn;
  return false;
}
