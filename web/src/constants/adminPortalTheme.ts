/** Login / navbar / sidebar accent — keep in sync across admin portals. */
export type AdminPortalKey = 'super' | 'school' | 'category' | 'subcategory' | 'ads' | 'external';

export const ADMIN_PORTAL_ACCENTS: Record<AdminPortalKey, string> = {
  super: '#3468f9',
  school: '#0f766e',
  category: '#2563eb',
  subcategory: '#4f46e5',
  ads: '#0284c7',
  external: '#7c3aed',
};

export const ADMIN_PORTAL_LABELS: Record<AdminPortalKey, string> = {
  super: 'Super Admin',
  school: 'School Admin',
  category: 'Category Admin',
  subcategory: 'Subcategory Admin',
  ads: 'Ads Admin',
  external: 'External Admin',
};
