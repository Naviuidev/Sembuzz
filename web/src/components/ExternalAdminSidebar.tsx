import { useQuery } from '@tanstack/react-query';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { externalAdminPipelineService } from '../services/external-admin-pipeline.service';
import { AdminSidebarNav, type AdminSidebarItem } from './AdminSidebarNav';

const primaryItems: AdminSidebarItem[] = [
  { path: '/external-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/external-admin/posts', label: 'Posts', icon: 'bi-file-post' },
  { path: '/external-admin/privacy', label: 'Privacy', icon: 'bi-shield-lock' },
];

export const ExternalAdminSidebar = () => {
  const { data: pipelineSummary } = useQuery({
    queryKey: ['external-admin', 'pipeline', 'summary'],
    queryFn: externalAdminPipelineService.summary,
    refetchInterval: 60_000,
  });

  const privacyLabel =
    pipelineSummary && pipelineSummary.schoolReplies > 0
      ? `Privacy (${pipelineSummary.schoolReplies})`
      : 'Privacy';

  const items: AdminSidebarItem[] = primaryItems.map((item) => {
    if (item.path === '/external-admin/privacy') return { ...item, label: privacyLabel };
    return item;
  });

  const secondaryItems: AdminSidebarItem[] = [
    { path: '/external-admin/profile', label: 'Your profile', icon: 'bi-person-circle' },
  ];

  return (
    <AdminSidebarNav
      accent={ADMIN_PORTAL_ACCENTS.external}
      items={items}
      secondaryItems={secondaryItems}
    />
  );
};
