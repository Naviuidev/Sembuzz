/** Sidebar / route ids for master admin portal access control */
export const MASTER_ADMIN_PORTAL_SECTIONS = [
  'dashboard',
  'schools',
  'posts',
  'social',
  'users',
  'categories',
  'external-config',
  'upcoming',
  'analytics',
  'raise-request',
  'blogs',
] as const;

export type MasterAdminPortalSectionId = (typeof MASTER_ADMIN_PORTAL_SECTIONS)[number];

export function isMasterAdminPortalSectionId(value: string): value is MasterAdminPortalSectionId {
  return (MASTER_ADMIN_PORTAL_SECTIONS as readonly string[]).includes(value);
}
