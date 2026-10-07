import { useQuery } from '@tanstack/react-query';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { subcategoryAdminExternalConfigService } from '../services/subcategory-admin-external-config.service';
import { AdminSidebarNav, type AdminSidebarItem } from './AdminSidebarNav';

const menuItems: AdminSidebarItem[] = [
  { path: '/subcategory-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/subcategory-admin/external-config', label: 'External config', icon: 'bi-box-arrow-in-right' },
  { path: '/subcategory-admin/posts', label: 'Posts', icon: 'bi-file-earmark-post' },
  { path: '/subcategory-admin/blogs', label: 'Blogs', icon: 'bi-journal-text' },
  { path: '/subcategory-admin/analytics', label: 'Analytics', icon: 'bi-graph-up-arrow' },
  { path: '/subcategory-admin/raise-query', label: 'Raise a query', icon: 'bi-question-circle' },
  { path: '/subcategory-admin/queries', label: 'Queries', icon: 'bi-chat-left-text' },
  { path: '/subcategory-admin/privacy', label: 'Privacy', icon: 'bi-shield-lock' },
];

export const SubCategoryAdminSidebar = () => {
  const { data: linkPending } = useQuery({
    queryKey: ['subcategory-admin', 'external-config', 'link-pending'],
    queryFn: subcategoryAdminExternalConfigService.linkPendingCount,
    refetchInterval: 60_000,
  });
  const { data: postPending } = useQuery({
    queryKey: ['subcategory-admin', 'external-config', 'post-pending'],
    queryFn: subcategoryAdminExternalConfigService.postPendingCount,
    refetchInterval: 60_000,
  });
  const total = (linkPending?.pending ?? 0) + (postPending?.pending ?? 0);
  const items = menuItems.map((item) =>
    item.path === '/subcategory-admin/external-config' && total > 0
      ? { ...item, label: `External config (${total})` }
      : item,
  );
  return <AdminSidebarNav accent={ADMIN_PORTAL_ACCENTS.subcategory} items={items} />;
};
