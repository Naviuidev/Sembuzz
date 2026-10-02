import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { AdminSidebarNav, type AdminSidebarItem } from './AdminSidebarNav';

const menuItems: AdminSidebarItem[] = [
  { path: '/super-admin/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { path: '/super-admin/schools/new', label: 'Create School', icon: 'bi-building-add' },
  { path: '/super-admin/features', label: 'Features', icon: 'bi-star' },
  { path: '/super-admin/queries', label: 'Queries', icon: 'bi-chat-left-text' },
  {
    path: '/super-admin/event-sync',
    label: 'Fetch events',
    icon: 'bi-link-45deg',
    title: 'Add page URLs and CSS selectors, then sync scraped events',
  },
  {
    path: '/super-admin/json-upload',
    label: 'JSON upload',
    icon: 'bi-filetype-json',
    title: 'Upload JSON file for event sources',
  },
  { path: '/super-admin/raise-request', label: 'Raise a Request', icon: 'bi-question-circle' },
];

export const SuperAdminSidebar = () => (
  <AdminSidebarNav accent={ADMIN_PORTAL_ACCENTS.super} items={menuItems} matchActive="prefix" />
);
