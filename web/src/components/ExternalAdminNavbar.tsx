import { useNavigate } from 'react-router-dom';
import { ADMIN_PORTAL_ACCENTS, ADMIN_PORTAL_LABELS } from '../constants/adminPortalTheme';
import { useExternalAdminAuth } from '../contexts/ExternalAdminAuthContext';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const ExternalAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useExternalAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/external-admin/login');
  };

  return (
    <AdminNavbarShell
      homePath="/external-admin/dashboard"
      portalLabel={ADMIN_PORTAL_LABELS.external}
      accentColor={ADMIN_PORTAL_ACCENTS.external}
    >
      <AdminNavbarActions role="ads-admin" onLogout={handleLogout} showNotifications={false} />
    </AdminNavbarShell>
  );
};
