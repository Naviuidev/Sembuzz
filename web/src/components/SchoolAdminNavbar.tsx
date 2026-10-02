import { useNavigate } from 'react-router-dom';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { ADMIN_PORTAL_ACCENTS, ADMIN_PORTAL_LABELS } from '../constants/adminPortalTheme';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const SchoolAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useSchoolAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/school-admin/login');
  };

  return (
    <AdminNavbarShell
      homePath="/school-admin/dashboard"
      portalLabel={ADMIN_PORTAL_LABELS.school}
      accentColor={ADMIN_PORTAL_ACCENTS.school}
    >
      <AdminNavbarActions role="school-admin" onLogout={handleLogout} />
    </AdminNavbarShell>
  );
};
