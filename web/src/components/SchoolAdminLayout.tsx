import type { ReactNode } from 'react';
import { AdminPortalLayout } from './AdminPortalLayout';
import { SchoolAdminNavbar } from './SchoolAdminNavbar';
import { SchoolAdminSidebar } from './SchoolAdminSidebar';

interface SchoolAdminLayoutProps {
  children: ReactNode;
}

export const SchoolAdminLayout = ({ children }: SchoolAdminLayoutProps) => {
  return (
    <AdminPortalLayout navbar={<SchoolAdminNavbar />} sidebar={<SchoolAdminSidebar />}>
      {children}
    </AdminPortalLayout>
  );
};
