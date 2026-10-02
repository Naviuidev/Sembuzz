import type { ReactNode } from 'react';
import { AdminPortalLayout } from './AdminPortalLayout';
import { CategoryAdminNavbar } from './CategoryAdminNavbar';
import { CategoryAdminSidebar } from './CategoryAdminSidebar';

interface CategoryAdminLayoutProps {
  children: ReactNode;
}

export const CategoryAdminLayout = ({ children }: CategoryAdminLayoutProps) => {
  return (
    <AdminPortalLayout navbar={<CategoryAdminNavbar />} sidebar={<CategoryAdminSidebar />}>
      {children}
    </AdminPortalLayout>
  );
};
