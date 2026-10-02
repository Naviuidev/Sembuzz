import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_PORTAL_ACCENTS, ADMIN_PORTAL_LABELS } from '../constants/adminPortalTheme';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const SuperAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/super-admin');
  };

  return (
    <AdminNavbarShell
      homePath="/super-admin/dashboard"
      portalLabel={ADMIN_PORTAL_LABELS.super}
      accentColor={ADMIN_PORTAL_ACCENTS.super}
    >
      <AdminNavbarActions role="super-admin" onLogout={handleLogout} />
    </AdminNavbarShell>
  );
};
