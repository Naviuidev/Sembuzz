import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { schoolsService } from '../services/schools.service';
import type { School } from '../services/schools.service';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';

export const Dashboard = () => {
  const { user } = useAuth();
  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ['schools'],
    queryFn: schoolsService.getAll,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* Top Navbar */}
      <SuperAdminNavbar />

      {/* Main Layout */}
      <div className="d-flex">
        {/* Sidebar */}
        <SuperAdminSidebar />

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '2rem',
          minHeight: 'calc(100vh - 60px)'
        }}>
          {/* Welcome Section */}
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
              Manage your schools and view important information
            </p>
          </div>

          {/* Schools List */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'normal',
                  color: '#1a1f2e',
                  margin: 0
                }}>
                  Schools
                </h2>
                <a
                  href="/super-admin/schools/new"
                  className="btn"
                  style={{
                    backgroundColor: '#1a1f2e',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    color: '#fff',
                    fontWeight: '500',
                    textDecoration: 'none',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#1a1f2e';
                    e.currentTarget.style.border = '1px solid #1a1f2e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1f2e';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.border = 'none';
                  }}
                >
                  + Create School
                </a>
              </div>

              {isLoading ? (
                <div className="text-center py-5">
                  <p style={{ color: '#6c757d' }}>Loading schools...</p>
                </div>
              ) : schools && schools.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                        <th style={{
                          fontWeight: '500',
                          color: '#1a1f2e',
                          padding: '1rem',
                          borderBottom: 'none'
                        }}>Ref Number</th>
                        <th style={{
                          fontWeight: '500',
                          color: '#1a1f2e',
                          padding: '1rem',
                          borderBottom: 'none'
                        }}>School Name</th>
                        <th style={{
                          fontWeight: '500',
                          color: '#1a1f2e',
                          padding: '1rem',
                          borderBottom: 'none'
                        }}>City</th>
                        <th style={{
                          fontWeight: '500',
                          color: '#1a1f2e',
                          padding: '1rem',
                          borderBottom: 'none'
                        }}>Features</th>
                        <th style={{
                          fontWeight: '500',
                          color: '#1a1f2e',
                          padding: '1rem',
                          borderBottom: 'none'
                        }}>Status</th>
                        <th style={{
                          fontWeight: '500',
                          color: '#1a1f2e',
                          padding: '1rem',
                          borderBottom: 'none'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools.map((school) => (
                        <tr key={school.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{
                            padding: '1rem',
                            color: '#6c757d',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem'
                          }}>
                            {school.refNum}
                          </td>
                          <td style={{
                            padding: '1rem',
                            color: '#1a1f2e',
                            fontWeight: '500'
                          }}>
                            {school.name}
                          </td>
                          <td style={{
                            padding: '1rem',
                            color: '#6c757d'
                          }}>
                            {school.city}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div className="d-flex flex-wrap gap-1">
                              {school.enabledFeatures.slice(0, 3).map((f) => (
                                <span
                                  key={f.code}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    backgroundColor: '#e7f3ff',
                                    color: '#1a1f2e',
                                    fontSize: '0.75rem',
                                    borderRadius: '50px',
                                    border: '1px solid #dee2e6'
                                  }}
                                >
                                  {f.name}
                                </span>
                              ))}
                              {school.enabledFeatures.length > 3 && (
                                <span
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    backgroundColor: '#d4edda',
                                    color: '#155724',
                                    fontSize: '0.75rem',
                                    borderRadius: '50px',
                                    border: '1px solid #c3e6cb',
                                    fontWeight: '500'
                                  }}
                                >
                                  +{school.enabledFeatures.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              style={{
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.75rem',
                                borderRadius: '50px',
                                backgroundColor: school.isActive ? '#d4edda' : '#f8d7da',
                                color: school.isActive ? '#155724' : '#721c24',
                                border: `1px solid ${school.isActive ? '#c3e6cb' : '#f5c6cb'}`
                              }}
                            >
                              {school.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <a
                              href={`/super-admin/schools/${school.id}`}
                              style={{
                                color: '#1a1f2e',
                                textDecoration: 'none',
                                fontWeight: '500',
                                transition: 'color 0.3s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#4dabf7'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#1a1f2e'}
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p style={{ color: '#6c757d', marginBottom: '1rem' }}>No schools found.</p>
                  <a
                    href="/super-admin/schools/new"
                    className="btn"
                    style={{
                      backgroundColor: '#1a1f2e',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#fff',
                      fontWeight: '500',
                      textDecoration: 'none',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.color = '#1a1f2e';
                      e.currentTarget.style.border = '1px solid #1a1f2e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a1f2e';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.border = 'none';
                    }}
                  >
                    Create Your First School
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
