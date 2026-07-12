import { useNavigate } from 'react-router-dom';
import { useAdsAdminAuth } from '../contexts/AdsAdminAuthContext';
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
      brandExtra={
        <span style={{ color: '#fff', marginLeft: '8px', fontSize: '0.9rem' }}>Ads Admin</span>
      }
    >
      <AdminNavbarActions role="ads-admin" onLogout={handleLogout} compactLogout />
    </AdminNavbarShell>
  );
};
