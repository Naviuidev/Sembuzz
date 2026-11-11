export type MasterAdminSchoolSectionId =
  | 'overview'
  | 'posts'
  | 'social'
  | 'users'
  | 'categories'
  | 'external-config'
  | 'upcoming'
  | 'analytics'
  | 'raise-request'
  | 'blogs';

export type MasterAdminSchoolSectionDef = {
  id: MasterAdminSchoolSectionId;
  label: string;
  icon: string;
  /** Shown even when no feature gate matches */
  always?: boolean;
  /** At least one enabled school feature code */
  featureCodes?: string[];
};

/** Master Admin main sidebar + school detail sections */
export const MASTER_ADMIN_SCHOOL_SECTIONS: MasterAdminSchoolSectionDef[] = [
  { id: 'posts', label: 'Posts', icon: 'bi-file-post', featureCodes: ['NEWS', 'EVENTS'] },
  { id: 'social', label: 'Social share', icon: 'bi-share', featureCodes: ['INSTAGRAM'] },
  { id: 'users', label: 'Users', icon: 'bi-people', always: true },
  { id: 'categories', label: 'Categories', icon: 'bi-folder', always: true },
  { id: 'external-config', label: 'External config', icon: 'bi-box-arrow-in-right', always: true },
  { id: 'upcoming', label: 'Upcoming news', icon: 'bi-calendar-event', featureCodes: ['NEWS'] },
  { id: 'analytics', label: 'Analytics', icon: 'bi-graph-up-arrow', featureCodes: ['ANALYTICS'] },
  { id: 'raise-request', label: 'Raise request', icon: 'bi-megaphone', always: true },
  { id: 'blogs', label: 'Blogs', icon: 'bi-journal-text', featureCodes: ['NEWS'] },
];

export function getMasterAdminSectionsForSchool(enabledFeatureCodes: string[]) {
  const enabled = new Set(enabledFeatureCodes.map((c) => c.toUpperCase()));
  return MASTER_ADMIN_SCHOOL_SECTIONS.filter((section) => {
    if (section.always) return true;
    if (!section.featureCodes?.length) return false;
    return section.featureCodes.some((code) => enabled.has(code.toUpperCase()));
  });
}

export function isMasterAdminSchoolSectionId(value: string | undefined): value is MasterAdminSchoolSectionId {
  if (value === 'overview') return true;
  return MASTER_ADMIN_SCHOOL_SECTIONS.some((s) => s.id === value);
}

export function masterAdminSchoolSectionPath(schoolId: string, sectionId: MasterAdminSchoolSectionId) {
  if (sectionId === 'overview') return `/master-admin/schools/${schoolId}`;
  return `/master-admin/schools/${schoolId}/${sectionId}`;
}
