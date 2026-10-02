import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { AdminSidebarNav, type AdminSidebarItem } from './AdminSidebarNav';

const menuItems: AdminSidebarItem[] = [
  { path: '/ads-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/ads-admin/ads', label: 'Ads', icon: 'bi-megaphone' },
  { path: '/ads-admin/ads-analytics', label: 'Ads Analytics', icon: 'bi-bar-chart-line' },
];

export const AdsAdminSidebar = () => (
  <AdminSidebarNav accent={ADMIN_PORTAL_ACCENTS.ads} items={menuItems} />
);
