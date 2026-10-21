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

export type HomeFeedModeFilter = 'mySchool' | 'allSchools' | 'external';

/** Match mobile home header: logged-in My school / All schools always get discover UI when user has a school. */
export function resolveShowSchoolFilterUi(
  filtersEnabled: boolean,
  visibility: FiltersVisibility | null | undefined,
  isLoggedIn: boolean,
  schoolId: string | null | undefined,
  homeFeedMode: HomeFeedModeFilter,
): boolean {
  if (isLoggedIn && schoolId && homeFeedMode !== 'external') return true;
  if (!filtersEnabled) return false;
  return shouldShowSchoolFilterUi(filtersEnabled, visibility, isLoggedIn);
}
