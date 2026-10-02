import type { ReactNode } from 'react';
import { AdminPortalLayout } from './AdminPortalLayout';
import { SubCategoryAdminNavbar } from './SubCategoryAdminNavbar';
import { SubCategoryAdminSidebar } from './SubCategoryAdminSidebar';

interface SubCategoryAdminLayoutProps {
  children: ReactNode;
}

export const SubCategoryAdminLayout = ({ children }: SubCategoryAdminLayoutProps) => {
  return (
    <AdminPortalLayout navbar={<SubCategoryAdminNavbar />} sidebar={<SubCategoryAdminSidebar />}>
      {children}
    </AdminPortalLayout>
  );
};
