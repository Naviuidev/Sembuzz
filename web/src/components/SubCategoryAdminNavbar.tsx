import { useNavigate } from 'react-router-dom';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const SubCategoryAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useSubCategoryAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/subcategory-admin/login');
  };

  return (
    <AdminNavbarShell homePath="/subcategory-admin/dashboard">
      <AdminNavbarActions role="subcategory-admin" onLogout={handleLogout} />
    </AdminNavbarShell>
  );
};
