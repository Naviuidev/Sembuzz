import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { AdminSidebarNav, type AdminSidebarItem } from './AdminSidebarNav';

const mainMenuItems: AdminSidebarItem[] = [
  { path: '/school-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/school-admin/social-share', label: 'Social Share', icon: 'bi-share' },
  { path: '/school-admin/user-requests', label: 'User requests', icon: 'bi-person-plus' },
  { path: '/school-admin/approved-users', label: 'Approved users', icon: 'bi-person-check' },
  { path: '/school-admin/automated-users', label: 'Automated users', icon: 'bi-people' },
  { path: '/school-admin/total-users', label: 'Total users', icon: 'bi-eye' },
  { path: '/school-admin/categories', label: 'Categories', icon: 'bi-folder' },
  { path: '/school-admin/user-help', label: 'Users help', icon: 'bi-question-circle' },
  { path: '/school-admin/privacy', label: 'Privacy', icon: 'bi-shield-lock' },
  { path: '/school-admin/create-post', label: 'Create post', icon: 'bi-plus-circle' },
  { path: '/school-admin/approved-posts', label: 'Approved posts', icon: 'bi-globe' },
  { path: '/school-admin/posts', label: 'Posts', icon: 'bi-file-post' },
  { path: '/school-admin/upcoming-news', label: 'Upcoming news', icon: 'bi-calendar-event' },
  { path: '/school-admin/analytics', label: 'Analytics', icon: 'bi-graph-up-arrow' },
  { path: '/school-admin/raise-request', label: 'Raise request', icon: 'bi-question-circle' },
];

const settingsMenuItems: AdminSidebarItem[] = [
  { path: '/school-admin/settings/queries', label: 'Settings · Queries', icon: 'bi-gear' },
];

export const SchoolAdminSidebar = () => (
  <AdminSidebarNav
    accent={ADMIN_PORTAL_ACCENTS.school}
    items={mainMenuItems}
    secondaryItems={settingsMenuItems}
  />
);
