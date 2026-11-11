import { useMemo } from 'react';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { MASTER_ADMIN_SCHOOL_SECTIONS } from '../constants/masterAdminSchoolSections';
import { useMasterAdminAuth } from '../contexts/MasterAdminAuthContext';
import { isPlatformMasterAdmin, masterAdminCanAccessSection } from '../utils/masterAdminPortalAccess';
import { AdminSidebarNav, type AdminSidebarItem } from './AdminSidebarNav';

const primaryItems: AdminSidebarItem[] = [
  { path: '/master-admin/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2', sectionId: 'dashboard' },
  { path: '/master-admin/schools', label: 'Schools', icon: 'bi-buildings', exactPathOnly: true, sectionId: 'schools' },
];

const developerLayerItem: AdminSidebarItem = {
  path: '/master-admin/developer-layer',
  label: 'Developer layer',
  icon: 'bi-layers',
};

export const MasterAdminSidebar = () => {
  const { user } = useMasterAdminAuth();

  const toolItems: AdminSidebarItem[] = useMemo(() => {
    const mapped = MASTER_ADMIN_SCHOOL_SECTIONS.map((section) => ({
      path: `/master-admin/${section.id}`,
      label: section.label,
      icon: section.icon,
      sectionId: section.id,
    }));
    if (!user || isPlatformMasterAdmin(user)) return mapped;
    return mapped.filter((item) =>
      masterAdminCanAccessSection(user, item.sectionId as Parameters<typeof masterAdminCanAccessSection>[1]),
    );
  }, [user]);

  const primary = useMemo(() => {
    if (!user || isPlatformMasterAdmin(user)) return primaryItems;
    return primaryItems.filter((item) =>
      item.sectionId
        ? masterAdminCanAccessSection(user, item.sectionId as Parameters<typeof masterAdminCanAccessSection>[1])
        : true,
    );
  }, [user]);

  const secondaryItems = isPlatformMasterAdmin(user) ? [...toolItems, developerLayerItem] : toolItems;

  return (
    <AdminSidebarNav
      accent={ADMIN_PORTAL_ACCENTS.master}
      items={primary}
      secondaryItems={secondaryItems}
      matchActive="exact"
    />
  );
};
