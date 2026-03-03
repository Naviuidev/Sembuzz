import type { ReactNode } from 'react';
import { SubCategoryAdminNavbar } from './SubCategoryAdminNavbar';
import { SubCategoryAdminSidebar } from './SubCategoryAdminSidebar';

interface SubCategoryAdminLayoutProps {
  children: ReactNode;
}

export const SubCategoryAdminLayout = ({ children }: SubCategoryAdminLayoutProps) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* Top Navbar */}
      <SubCategoryAdminNavbar />

      {/* Main Layout */}
      <div className="d-flex">
        {/* Sidebar */}
        <SubCategoryAdminSidebar />

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '2rem',
          minHeight: 'calc(100vh - 60px)'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};
