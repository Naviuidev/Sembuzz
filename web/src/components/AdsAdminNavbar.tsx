import { useNavigate } from 'react-router-dom';
import { useAdsAdminAuth } from '../contexts/AdsAdminAuthContext';
import { ADMIN_PORTAL_ACCENTS, ADMIN_PORTAL_LABELS } from '../constants/adminPortalTheme';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const AdsAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useAdsAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/ads-admin/login');
  };

  return (
    <AdminNavbarShell
      homePath="/ads-admin/dashboard"
      portalLabel={ADMIN_PORTAL_LABELS.ads}
      accentColor={ADMIN_PORTAL_ACCENTS.ads}
    >
      <AdminNavbarActions role="ads-admin" onLogout={handleLogout} />
    </AdminNavbarShell>
  );
};
