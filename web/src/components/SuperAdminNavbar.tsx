import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const SuperAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/super-admin');
  };

  return (
    <AdminNavbarShell homePath="/super-admin/dashboard">
      <AdminNavbarActions role="super-admin" onLogout={handleLogout} />
    </AdminNavbarShell>
  );
};
