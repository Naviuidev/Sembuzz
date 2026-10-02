import { useNavigate } from 'react-router-dom';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { ADMIN_PORTAL_ACCENTS, ADMIN_PORTAL_LABELS } from '../constants/adminPortalTheme';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const CategoryAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useCategoryAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/category-admin/login');
  };

  return (
    <AdminNavbarShell
      homePath="/category-admin/dashboard"
      portalLabel={ADMIN_PORTAL_LABELS.category}
      accentColor={ADMIN_PORTAL_ACCENTS.category}
    >
      <AdminNavbarActions role="category-admin" onLogout={handleLogout} />
    </AdminNavbarShell>
  );
};
