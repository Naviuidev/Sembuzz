import type { ReactNode } from 'react';
import { AdminPortalLayout } from './AdminPortalLayout';
import { ExternalAdminNavbar } from './ExternalAdminNavbar';
import { ExternalAdminSidebar } from './ExternalAdminSidebar';

export const ExternalAdminLayout = ({ children }: { children: ReactNode }) => {
  return (
    <AdminPortalLayout navbar={<ExternalAdminNavbar />} sidebar={<ExternalAdminSidebar />}>
      {children}
    </AdminPortalLayout>
  );
};
