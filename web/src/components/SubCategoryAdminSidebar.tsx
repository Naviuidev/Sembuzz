import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { AdminSidebarNav, type AdminSidebarItem } from './AdminSidebarNav';

const menuItems: AdminSidebarItem[] = [
  { path: '/subcategory-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/subcategory-admin/post-event', label: 'Post the event', icon: 'bi-plus-circle' },
  { path: '/subcategory-admin/blogs', label: 'Blogs', icon: 'bi-journal-text' },
  { path: '/subcategory-admin/analytics', label: 'Analytics', icon: 'bi-graph-up-arrow' },
  { path: '/subcategory-admin/raise-query', label: 'Raise a query', icon: 'bi-question-circle' },
  { path: '/subcategory-admin/queries', label: 'Queries', icon: 'bi-chat-left-text' },
  { path: '/subcategory-admin/privacy', label: 'Privacy', icon: 'bi-shield-lock' },
];

export const SubCategoryAdminSidebar = () => (
  <AdminSidebarNav accent={ADMIN_PORTAL_ACCENTS.subcategory} items={menuItems} />
);
