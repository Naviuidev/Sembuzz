import { Link, useNavigate } from 'react-router-dom';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';

export const SubCategoryAdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useSubCategoryAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/subcategory-admin/login');
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
        <Link className="navbar-brand d-flex align-items-center" to="/subcategory-admin/dashboard" style={{ fontSize: '1.25rem', fontWeight: '600' }}>
          <span style={{ 
            display: 'inline-block',
            width: '30px',
            height: '30px',
            background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
            borderRadius: '6px',
            marginRight: '10px',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '8px',
              background: '#fff',
              borderRadius: '1px'
            }}></span>
            <span style={{
              position: 'absolute',
              bottom: '4px',
              left: '40%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '12px',
              background: '#fff',
              borderRadius: '1px'
            }}></span>
            <span style={{
              position: 'absolute',
              bottom: '4px',
              left: '60%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '6px',
              background: '#fff',
              borderRadius: '1px'
            }}></span>
          </span>
          <span style={{ color: '#fff' }}>Sem</span>
          <span style={{ color: '#4dabf7' }}>Buzz</span>
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
