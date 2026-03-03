import { Navigate, Outlet } from 'react-router-dom';
import { useAdsAdminAuth } from '../contexts/AdsAdminAuthContext';

export const AdsAdminProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, user, loading } = useAdsAdminAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/ads-admin/login" replace />;
  }

  if (user?.isFirstLogin) {
    return <Navigate to="/ads-admin/set-password" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
