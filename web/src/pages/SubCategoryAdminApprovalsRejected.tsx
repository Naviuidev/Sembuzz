import { useQuery } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { subcategoryAdminEventsService, type RevertedEvent } from '../services/subcategory-admin-events.service';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const SubCategoryAdminApprovalsRejected = () => {
  const { data: revertedEvents = [], isLoading, error } = useQuery({
    queryKey: ['subcategory-admin', 'events', 'reverted'],
    queryFn: () => subcategoryAdminEventsService.getReverted(),
  });

  return (
    <SubCategoryAdminLayout>
      <div className="mb-4">
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'normal',
          color: '#1a1f2e',
          marginBottom: '0.5rem'
        }}>
          Approvals rejected
        </h1>
        <p style={{
          color: '#6c757d',
          fontSize: '1rem',
          marginBottom: 0
        }}>
          Events sent back for changes. Use the category admin feedback to improve and resubmit.
        </p>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
        <div className="card-body p-4">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" role="status" />
              <p className="mt-2 mb-0" style={{ color: '#6c757d' }}>Loading…</p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <i className="bi bi-exclamation-circle" style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }} />
              <p style={{ color: '#6c757d', margin: 0 }}>Failed to load rejected approvals</p>
            </div>
          ) : revertedEvents.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-x-circle" style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }} />
              <p style={{ color: '#6c757d', margin: 0 }}>No rejected approvals</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover" style={{ marginBottom: 0 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Event Title</th>
                    <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Subcategory</th>
                    <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Category admin feedback</th>
                    <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Reverted on</th>
                    <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(revertedEvents as RevertedEvent[]).map((event) => (
                    <tr key={event.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem', verticalAlign: 'middle', color: '#1a1f2e' }}>{event.title}</td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>{event.subCategory?.name ?? '—'}</td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle', maxWidth: '320px' }}>
                        {event.revertNotes ? (
                          <span style={{ color: '#1a1f2e' }}>{event.revertNotes}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle', color: '#6c757d' }}>{formatDate(event.updatedAt)}</td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <a
                          href="/subcategory-admin/post-event"
                          className="btn btn-sm btn-outline-primary"
                          style={{ borderRadius: '0px' }}
                        >
                          Resubmit (post new)
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SubCategoryAdminLayout>
  );
};
