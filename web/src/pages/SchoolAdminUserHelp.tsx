import { useQuery } from '@tanstack/react-query';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { SchoolAdminProtectedRoute } from '../components/SchoolAdminProtectedRoute';
import { schoolAdminUserHelpService, type UserHelpQueryForAdmin } from '../services/school-admin-user-help.service';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export const SchoolAdminUserHelp = () => {
  const { data: queries = [], isLoading, error } = useQuery({
    queryKey: ['school-admin', 'user-help'],
    queryFn: () => schoolAdminUserHelpService.getAll(),
  });

  return (
    <SchoolAdminProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
        <SchoolAdminNavbar />
        <div className="d-flex">
          <SchoolAdminSidebar />
          <div style={{ flex: 1, padding: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#1a1f2e', marginBottom: '0.5rem' }}>
              Users help
            </h1>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              Queries raised by app users from your school. They will see these in the Help tab in the app.
            </p>

            {isLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 mb-0 text-muted">Loading…</p>
              </div>
            )}

            {error && (
              <div className="alert alert-danger" style={{ borderRadius: '8px' }}>
                {error instanceof Error ? error.message : 'Failed to load user help queries.'}
              </div>
            )}

            {!isLoading && !error && queries.length === 0 && (
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body text-center py-5">
                  <i className="bi bi-question-circle text-muted" style={{ fontSize: '3rem' }} />
                  <p className="mt-2 mb-0 text-muted">No user queries yet.</p>
                  <p className="small text-muted mt-1">When app users raise a query from the Help screen, it will appear here.</p>
                </div>
              </div>
            )}

            {!isLoading && !error && queries.length > 0 && (
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-0">
                  <ul className="list-unstyled mb-0">
                    {queries.map((q: UserHelpQueryForAdmin) => (
                      <li
                        key={q.id}
                        className="p-4 border-bottom"
                        style={{ borderColor: '#eee' }}
                      >
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                          <div>
                            <span className="fw-semibold" style={{ color: '#1a1f2e' }}>
                              {q.user?.name ?? 'Unknown'}
                            </span>
                            <span className="text-muted small ms-2">{q.user?.email}</span>
                          </div>
                          <span className="badge bg-secondary" style={{ fontSize: '0.75rem' }}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-muted small mb-1 mt-1">{formatDate(q.createdAt)}</p>
                        <p className="mb-0 mt-2" style={{ whiteSpace: 'pre-wrap', color: '#1a1f2e' }}>
                          {q.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SchoolAdminProtectedRoute>
  );
};
