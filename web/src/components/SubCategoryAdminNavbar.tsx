import { useNavigate } from 'react-router-dom';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import { ADMIN_PORTAL_ACCENTS, ADMIN_PORTAL_LABELS } from '../constants/adminPortalTheme';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const SubCategoryAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useSubCategoryAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/subcategory-admin/login');
  };

  return (
    <AdminNavbarShell
      homePath="/subcategory-admin/dashboard"
      portalLabel={ADMIN_PORTAL_LABELS.subcategory}
      accentColor={ADMIN_PORTAL_ACCENTS.subcategory}
    >
      <AdminNavbarActions role="subcategory-admin" onLogout={handleLogout} />
    </AdminNavbarShell>
  );
};
