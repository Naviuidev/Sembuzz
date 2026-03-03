import { Navigate } from 'react-router-dom';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import { SubCategoryAdminChangePassword } from '../pages/SubCategoryAdminChangePassword';

export const SubCategoryAdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useSubCategoryAdminAuth();

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/subcategory-admin/login" replace />;
  }

  // If first login, show password change page
  if (user?.isFirstLogin) {
    return <SubCategoryAdminChangePassword />;
  }

  return <>{children}</>;
};
