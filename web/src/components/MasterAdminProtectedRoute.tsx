import { Navigate } from 'react-router-dom';
import { useMasterAdminAuth } from '../contexts/MasterAdminAuthContext';

export const MasterAdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useMasterAdminAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/master-admin/login" replace />;
  }

  return <>{children}</>;
};
