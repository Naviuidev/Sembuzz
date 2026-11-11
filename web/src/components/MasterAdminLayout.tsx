import type { ReactNode } from 'react';
import { AdminPortalLayout } from './AdminPortalLayout';
import { MasterAdminPortalAccess } from './MasterAdminPortalAccess';
import { MasterAdminNavbar } from './MasterAdminNavbar';
import { MasterAdminSidebar } from './MasterAdminSidebar';

export const MasterAdminLayout = ({ children }: { children: ReactNode }) => (
  <MasterAdminPortalAccess>
    <AdminPortalLayout navbar={<MasterAdminNavbar />} sidebar={<MasterAdminSidebar />}>
      {children}
    </AdminPortalLayout>
  </MasterAdminPortalAccess>
);
