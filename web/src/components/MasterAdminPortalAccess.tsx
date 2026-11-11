import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMasterAdminAuth } from '../contexts/MasterAdminAuthContext';
import {
  defaultPortalPathForUser,
  isPlatformMasterAdmin,
  masterAdminCanAccessSection,
  pathnameToPortalSection,
} from '../utils/masterAdminPortalAccess';

export function MasterAdminPortalAccess({ children }: { children: React.ReactNode }) {
  const { user, loading } = useMasterAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;

    if (user.isFirstLogin && user.role === 'school_master_admin') {
      if (location.pathname !== '/master-admin/set-password') {
        navigate('/master-admin/set-password', { replace: true });
      }
      return;
    }

    if (location.pathname.startsWith('/master-admin/developer-layer') && !isPlatformMasterAdmin(user)) {
      navigate(defaultPortalPathForUser(user), { replace: true });
      return;
    }

    const section = pathnameToPortalSection(location.pathname);
    if (section && !masterAdminCanAccessSection(user, section)) {
      navigate(defaultPortalPathForUser(user), { replace: true });
    }
  }, [loading, user, location.pathname, navigate]);

  return <>{children}</>;
}
