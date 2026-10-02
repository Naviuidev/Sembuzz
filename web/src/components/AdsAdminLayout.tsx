import type { ReactNode } from 'react';
import { AdminPortalLayout } from './AdminPortalLayout';
import { AdsAdminNavbar } from './AdsAdminNavbar';
import { AdsAdminSidebar } from './AdsAdminSidebar';

interface AdsAdminLayoutProps {
  children: ReactNode;
}

export const AdsAdminLayout = ({ children }: AdsAdminLayoutProps) => {
  return (
    <AdminPortalLayout navbar={<AdsAdminNavbar />} sidebar={<AdsAdminSidebar />}>
      {children}
    </AdminPortalLayout>
  );
};
