import type { MasterAdminPortalSectionId } from '../constants/masterAdminPortalSections';
import type { MasterAdminUser } from '../services/master-admin-auth.service';

export function isPlatformMasterAdmin(user: MasterAdminUser | null | undefined): boolean {
  return user?.role === 'master_admin' || user?.role === undefined;
}

export function masterAdminCanAccessSection(
  user: MasterAdminUser | null | undefined,
  sectionId: MasterAdminPortalSectionId,
): boolean {
  if (!user) return false;
  if (isPlatformMasterAdmin(user)) return true;
  if (user.role === 'school_master_admin') {
    return (user.allowedPortalSections ?? []).includes(sectionId);
  }
  return false;
}

export function pathnameToPortalSection(pathname: string): MasterAdminPortalSectionId | null {
  const base = pathname.replace(/\/$/, '');
  if (base === '/master-admin/dashboard') return 'dashboard';
  if (base === '/master-admin/schools' || base.startsWith('/master-admin/schools/')) return 'schools';
  if (base === '/master-admin/developer-layer') return null;
  if (base === '/master-admin/set-password') return null;
  if (base === '/master-admin/login') return null;
  const match = base.match(/^\/master-admin\/([^/]+)/);
  if (!match) return null;
  return match[1] as MasterAdminPortalSectionId;
}

export function defaultPortalPathForUser(user: MasterAdminUser): string {
  if (isPlatformMasterAdmin(user)) return '/master-admin/dashboard';
  const allowed = user.allowedPortalSections ?? [];
  if (allowed.includes('dashboard')) return '/master-admin/dashboard';
  if (allowed.includes('schools')) return '/master-admin/schools';
  const first = allowed[0];
  return first ? `/master-admin/${first}` : '/master-admin/login';
}
