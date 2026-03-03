import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { schoolAdminStudentsService } from '../services/school-admin-students.service';

export const SchoolAdminDashboard = () => {
  const { user } = useSchoolAdminAuth();
  const [approvedCount, setApprovedCount] = useState<number | null>(null);

  useEffect(() => {
    schoolAdminStudentsService
      .getApproved()
      .then((list) => setApprovedCount(list.length))
      .catch(() => setApprovedCount(0));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="mb-4">
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'normal',
              color: '#1a1f2e',
              marginBottom: '0.5rem'
            }}>
              Welcome back, {user?.name}
            </h1>
            <p style={{
              color: '#6c757d',
              fontSize: '1rem',
              marginBottom: 0
            }}>
              View and manage your school information
            </p>
          </div>

          {user?.isFirstLogin && (
            <div className="alert alert-warning mb-4" style={{ borderRadius: '0px' }}>
              <strong>First Login Required:</strong> Please change your password to continue using the portal.
            </div>
          )}

          {/* School Details Card */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'normal',
                color: '#1a1f2e',
                marginBottom: '1.5rem'
              }}>
                School Details
              </h2>
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                    School Name
                  </label>
                  <div style={{ fontSize: '1rem', color: '#1a1f2e', fontWeight: '500' }}>
                    {user?.schoolName || 'N/A'}
                  </div>
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                    Reference Number
                  </label>
                  <div style={{ 
                    fontSize: '1rem', 
                    color: '#1a1f2e', 
                    fontFamily: 'monospace',
                    fontWeight: '500'
                  }}>
                    {user?.refNum || 'N/A'}
                  </div>
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                    Admin Email
                  </label>
                  <div style={{ fontSize: '1rem', color: '#1a1f2e' }}>
                    {user?.email || 'N/A'}
                  </div>
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                    Admin Name
                  </label>
                  <div style={{ fontSize: '1rem', color: '#1a1f2e' }}>
                    {user?.name || 'N/A'}
                  </div>
                </div>
                <div className="col-md-12">
                  <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                    Enabled Features
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {user?.features && user.features.length > 0 ? (
                      user.features.map((feature) => (
                        <span
                          key={feature.code}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#e7f3ff',
                            color: '#1a1f2e',
                            fontSize: '0.875rem',
                            borderRadius: '50px',
                            border: '1px solid #dee2e6'
                          }}
                        >
                          {feature.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>No features enabled</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links: Approved users & User requests */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <Link
                to="/school-admin/approved-users"
                className="card border-0 shadow-sm text-decoration-none"
                style={{ borderRadius: '0px', color: 'inherit' }}
              >
                <div className="card-body p-4 d-flex align-items-center">
                  <i className="bi bi-person-check me-3" style={{ fontSize: '2rem', color: '#1a1f2e' }} />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a1f2e', marginBottom: '0.25rem' }}>
                      Approved users
                    </h3>
                    <p className="text-muted small mb-0">
                      {approvedCount === null ? '…' : `${approvedCount} user${approvedCount !== 1 ? 's' : ''}`} · View & manage
                    </p>
                  </div>
                  <i className="bi bi-chevron-right ms-auto text-muted" />
                </div>
              </Link>
            </div>
            <div className="col-md-6">
              <Link
                to="/school-admin/user-requests"
                className="card border-0 shadow-sm text-decoration-none"
                style={{ borderRadius: '0px', color: 'inherit' }}
              >
                <div className="card-body p-4 d-flex align-items-center">
                  <i className="bi bi-person-plus me-3" style={{ fontSize: '2rem', color: '#1a1f2e' }} />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a1f2e', marginBottom: '0.25rem' }}>
                      User requests
                    </h3>
                    <p className="text-muted small mb-0">
                      Approve or deny Gmail signups
                    </p>
                  </div>
                  <i className="bi bi-chevron-right ms-auto text-muted" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
