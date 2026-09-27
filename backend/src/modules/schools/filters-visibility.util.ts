export const FILTERS_FEATURE_CODE = 'FILTERS';

export type FiltersVisibilityValue = 'BEFORE_LOGIN' | 'AFTER_LOGIN' | 'BOTH';

export function shouldShowSchoolFilterUi(
  filtersEnabled: boolean,
  visibility: FiltersVisibilityValue | null | undefined,
  isLoggedIn: boolean,
): boolean {
  if (!filtersEnabled || !visibility) return false;
  if (visibility === 'BOTH') return true;
  if (visibility === 'BEFORE_LOGIN') return !isLoggedIn;
  if (visibility === 'AFTER_LOGIN') return isLoggedIn;
  return false;
}
