import { MASTER_ADMIN_SCHOOL_SECTIONS } from './masterAdminSchoolSections';

export type MasterAdminPortalSectionId =
  | 'dashboard'
  | 'schools'
  | (typeof MASTER_ADMIN_SCHOOL_SECTIONS)[number]['id'];

export const MASTER_ADMIN_PORTAL_SECTION_OPTIONS: {
  id: MasterAdminPortalSectionId;
  label: string;
  icon: string;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { id: 'schools', label: 'Schools', icon: 'bi-buildings' },
  ...MASTER_ADMIN_SCHOOL_SECTIONS.map((s) => ({
    id: s.id as MasterAdminPortalSectionId,
    label: s.label,
    icon: s.icon,
  })),
];
