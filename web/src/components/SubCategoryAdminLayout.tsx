import type { ReactNode } from 'react';
import { SubCategoryAdminNavbar } from './SubCategoryAdminNavbar';
import { SubCategoryAdminSidebar } from './SubCategoryAdminSidebar';

interface SubCategoryAdminLayoutProps {
  children: ReactNode;
}

export const SubCategoryAdminLayout = ({ children }: SubCategoryAdminLayoutProps) => {
  return (
    <div className="admin-shell" style={{ backgroundColor: '#fafafa' }}>
      <SubCategoryAdminNavbar />
      <div className="admin-shell-body">
        <SubCategoryAdminSidebar />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
};
