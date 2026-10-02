import type { ReactNode } from 'react';
import { AdminPortalLayout } from './AdminPortalLayout';
import { SuperAdminNavbar } from './SuperAdminNavbar';
import { SuperAdminSidebar } from './SuperAdminSidebar';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => (
  <AdminPortalLayout navbar={<SuperAdminNavbar />} sidebar={<SuperAdminSidebar />}>
    {children}
  </AdminPortalLayout>
);
