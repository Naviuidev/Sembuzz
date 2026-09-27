export type FiltersVisibility = 'BEFORE_LOGIN' | 'AFTER_LOGIN' | 'BOTH';

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
