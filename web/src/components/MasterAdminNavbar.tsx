import { useNavigate } from 'react-router-dom';
import { ADMIN_PORTAL_ACCENTS, ADMIN_PORTAL_LABELS } from '../constants/adminPortalTheme';
import { useMasterAdminAuth } from '../contexts/MasterAdminAuthContext';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const MasterAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useMasterAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/master-admin/login');
  };

  return (
    <AdminNavbarShell
      homePath="/master-admin/dashboard"
      portalLabel={ADMIN_PORTAL_LABELS.master}
      accentColor={ADMIN_PORTAL_ACCENTS.master}
    >
      <AdminNavbarActions role="ads-admin" onLogout={handleLogout} showNotifications={false} />
    </AdminNavbarShell>
  );
};
