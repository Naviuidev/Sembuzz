import { Link } from 'react-router-dom';
import { useAdsAdminAuth } from '../contexts/AdsAdminAuthContext';
import { AdsAdminNavbar } from '../components/AdsAdminNavbar';
import { AdsAdminSidebar } from '../components/AdsAdminSidebar';

export const AdsAdminDashboard = () => {
  const { user } = useAdsAdminAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <AdsAdminNavbar />
      <div className="d-flex">
        <AdsAdminSidebar />
        <div style={{ flex: 1, padding: '2rem', minHeight: 'calc(100vh - 60px)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>Dashboard</h1>
          <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '2rem' }}>
            Manage banner and sponsored ads for {user?.schoolName ?? 'your school'}.
          </p>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <Link
                to="/ads-admin/ads"
                className="card border-0 shadow-sm text-decoration-none"
                style={{ borderRadius: '0px', color: '#1a1f2e' }}
              >
                <div className="card-body p-4">
                  <i className="bi bi-megaphone" style={{ fontSize: '2rem', color: '#1a1f2e' }} />
                  <h5 className="card-title mt-2 mb-1">Ads</h5>
                  <p className="card-text small text-muted mb-0">Create and manage banner ads and sponsored ads.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
