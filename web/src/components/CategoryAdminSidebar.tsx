import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { AdminSidebarNav, type AdminSidebarItem } from './AdminSidebarNav';

const menuItems: AdminSidebarItem[] = [
  { path: '/category-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/category-admin/pending-approvals', label: 'Pending approvals', icon: 'bi-clock-history' },
  { path: '/category-admin/blogs', label: 'View blogs', icon: 'bi-journal-text' },
  { path: '/category-admin/approved-posts', label: 'Approved post', icon: 'bi-check-circle' },
  { path: '/category-admin/analytics', label: 'Analytics', icon: 'bi-graph-up-arrow' },
  { path: '/category-admin/raise-request', label: 'Raise request', icon: 'bi-question-circle' },
  { path: '/category-admin/queries', label: 'Queries', icon: 'bi-chat-left-text' },
  { path: '/category-admin/privacy', label: 'Privacy', icon: 'bi-shield-lock' },
];

export const CategoryAdminSidebar = () => (
  <AdminSidebarNav accent={ADMIN_PORTAL_ACCENTS.category} items={menuItems} />
);
