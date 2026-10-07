import { useQuery } from '@tanstack/react-query';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { schoolAdminExternalPipelineService } from '../services/school-admin-external-pipeline.service';
import { schoolAdminExternalPostRequestsService } from '../services/school-admin-external-post-requests.service';
import { AdminSidebarNav, type AdminSidebarItem } from './AdminSidebarNav';

const mainMenuItems: AdminSidebarItem[] = [
  { path: '/school-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/school-admin/social-share', label: 'Social Share', icon: 'bi-share' },
  { path: '/school-admin/users', label: 'Users', icon: 'bi-people' },
  { path: '/school-admin/categories', label: 'Categories', icon: 'bi-folder' },
  { path: '/school-admin/privacy', label: 'Privacy', icon: 'bi-shield-lock' },
  { path: '/school-admin/external-config', label: 'External config', icon: 'bi-box-arrow-in-right' },
  { path: '/school-admin/posts', label: 'Posts', icon: 'bi-file-post' },
  { path: '/school-admin/upcoming-news', label: 'Upcoming news', icon: 'bi-calendar-event' },
  { path: '/school-admin/analytics', label: 'Analytics', icon: 'bi-graph-up-arrow' },
  { path: '/school-admin/raise-request', label: 'Raise request', icon: 'bi-question-circle' },
];

const settingsMenuItems: AdminSidebarItem[] = [
  { path: '/school-admin/settings/queries', label: 'Settings · Queries', icon: 'bi-gear' },
];

export const SchoolAdminSidebar = () => {
  const { data: pipelinePending } = useQuery({
    queryKey: ['school-admin', 'external-pipeline', 'pending-count'],
    queryFn: schoolAdminExternalPipelineService.pendingCount,
    refetchInterval: 60_000,
  });

  const { data: postPending } = useQuery({
    queryKey: ['school-admin', 'external-post-requests', 'pending-count'],
    queryFn: schoolAdminExternalPostRequestsService.pendingCount,
    refetchInterval: 60_000,
  });

  const externalPendingTotal =
    (pipelinePending?.pending ?? 0) + (postPending?.pending ?? 0);

  const items = mainMenuItems.map((item) =>
    item.path === '/school-admin/external-config' && externalPendingTotal > 0
      ? { ...item, label: `External config (${externalPendingTotal})` }
      : item,
  );

  return (
    <AdminSidebarNav
      accent={ADMIN_PORTAL_ACCENTS.school}
      items={items}
      secondaryItems={settingsMenuItems}
    />
  );
};
