import { Link, useNavigate } from 'react-router-dom';
import { useAdsAdminAuth } from '../contexts/AdsAdminAuthContext';

export const AdsAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useAdsAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/ads-admin/login');
  };

  return (
    <nav className="navbar sticky-top navbar-expand-lg" style={{ backgroundColor: 'white', padding: '0.75rem 2rem' }}>
      <div
        className="d-flex container align-items-center justify-content-between w-100"
        style={{
          backgroundColor: '#1a1f2e',
          borderRadius: '50px',
          padding: '0.55rem 1rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}
      >
        <Link className="navbar-brand d-flex align-items-center" to="/ads-admin/dashboard" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
          <img src="/logo.png" alt="Sembuzz" style={{ height: '28px', width: 'auto', marginRight: '8px' }} />
          <span style={{ color: '#fff' }}>Sembuzz</span>
          <span style={{ color: '#fff', marginLeft: '8px', fontSize: '0.9rem' }}>Ads Admin</span>
        </Link>
        <button
          onClick={handleLogout}
          className="btn"
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '0.4rem 1rem',
            color: '#1a1f2e',
            fontWeight: '500',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
