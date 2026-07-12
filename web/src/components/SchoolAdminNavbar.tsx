import { useNavigate } from 'react-router-dom';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { AdminNavbarActions, AdminNavbarShell } from './AdminNavbarActions';

export const SchoolAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useSchoolAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/school-admin/login');
  };

  return (
    <AdminNavbarShell homePath="/school-admin/dashboard">
      <AdminNavbarActions role="school-admin" onLogout={handleLogout} />
    </AdminNavbarShell>
  );
};
