import { Navigate } from 'react-router-dom';
import { useExternalAdminAuth } from '../contexts/ExternalAdminAuthContext';

export const ExternalAdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, loading } = useExternalAdminAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/external-admin/login" replace />;
  }

  if (user?.isFirstLogin) {
    return <Navigate to="/external-admin/set-password" replace />;
  }

  return <>{children}</>;
};
