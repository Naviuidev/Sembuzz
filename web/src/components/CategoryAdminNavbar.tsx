import { Link, useNavigate } from 'react-router-dom';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';

export const CategoryAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useCategoryAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/category-admin/login');
  };

  return (
    <nav className="navbar sticky-top navbar-expand-lg" style={{ 
      backgroundColor: 'white',
      padding: '0.75rem 2rem'
    }}>
      <div className="d-flex container align-items-center justify-content-between w-100"
      style={{
        backgroundColor: '#1a1f2e',
        borderRadius: '50px',
        padding: '0.55rem 1rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Brand/Logo */}
        <Link className="navbar-brand d-flex align-items-center" to="/category-admin/dashboard" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
          <img src="/logo.png" alt="Sembuzz" style={{ height: '28px', width: 'auto', marginRight: '8px' }} />
          <span style={{ color: '#fff' }}>Sembuzz</span>
        </Link>

        {/* Logout Button */}
        <div className="d-flex align-items-center">
          <button
            onClick={handleLogout}
            className="btn"
            style={{
              backgroundColor: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50px',
              padding: '0.5rem 1.5rem',
              color: '#1a1f2e',
              fontWeight: '500',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1f2e';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#1a1f2e';
              e.currentTarget.style.borderColor = 'rgb(255, 255, 255)';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
