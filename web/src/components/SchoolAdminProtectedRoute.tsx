import { Navigate } from 'react-router-dom';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { SchoolAdminChangePassword } from '../pages/SchoolAdminChangePassword';

export const SchoolAdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useSchoolAdminAuth();

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/school-admin/login" replace />;
  }

  // If first login, show password change page
  if (user?.isFirstLogin) {
    return <SchoolAdminChangePassword />;
  }

  return <>{children}</>;
};
