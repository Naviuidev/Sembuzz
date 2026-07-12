import { useNavigate } from 'react-router-dom';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const CategoryAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useCategoryAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/category-admin/login');
  };

  return (
    <AdminNavbarShell homePath="/category-admin/dashboard">
      <AdminNavbarActions role="category-admin" onLogout={handleLogout} />
    </AdminNavbarShell>
  );
};
