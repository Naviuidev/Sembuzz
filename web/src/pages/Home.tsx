import { Navbar } from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      {/* Hero Section */}
      <div className="container-fluid py-5" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4" style={{ fontSize: '3.5rem', fontWeight: '700' }}>
                Welcome to SemBuzz
              </h1>
              <p className="lead mb-4" style={{ fontSize: '1.25rem', opacity: 0.9 }}>
                Your Complete School Management Solution
              </p>
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className="btn btn-light btn-lg px-4 py-3"
                  style={{
                    borderRadius: '8px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                  onClick={() => navigate('/events', { state: { openAuth: 'signup', bottomNav: 'settings' } })}
                >
                  Get Started
                </button>
                <Link
                  to="/about"
                  className="btn btn-outline-light btn-lg px-4 py-3"
                  style={{
                    borderRadius: '8px',
                    fontWeight: '600',
                    borderWidth: '2px'
                  }}
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-5">
        <h2 className="text-center mb-5" style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700',
          color: '#1a1f2e'
        }}>
          Why Choose SemBuzz?
        </h2>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-3" style={{ fontSize: '3rem' }}>📚</div>
                <h3 className="card-title mb-3" style={{ fontWeight: '600' }}>Easy Management</h3>
                <p className="card-text text-muted">
                  Streamline your school operations with our comprehensive management system.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-3" style={{ fontSize: '3rem' }}>👥</div>
                <h3 className="card-title mb-3" style={{ fontWeight: '600' }}>Parent Engagement</h3>
                <p className="card-text text-muted">
                  Keep parents informed and engaged with real-time updates and communication.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-3" style={{ fontSize: '3rem' }}>📊</div>
                <h3 className="card-title mb-3" style={{ fontWeight: '600' }}>Analytics & Reports</h3>
                <p className="card-text text-muted">
                  Make data-driven decisions with comprehensive analytics and reporting tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
