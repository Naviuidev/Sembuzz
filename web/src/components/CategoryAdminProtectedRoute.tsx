import { Navigate } from 'react-router-dom';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { CategoryAdminChangePassword } from '../pages/CategoryAdminChangePassword';

export const CategoryAdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useCategoryAdminAuth();

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/category-admin/login" replace />;
  }

  // If first login, show password change page
  if (user?.isFirstLogin) {
    return <CategoryAdminChangePassword />;
  }

  return <>{children}</>;
};
