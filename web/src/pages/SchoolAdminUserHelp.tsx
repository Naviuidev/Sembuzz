import { useQuery } from '@tanstack/react-query';
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

function statusPillClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'open' || s === 'pending') return 'admin-pill admin-pill--warning';
  if (s === 'resolved' || s === 'closed') return 'admin-pill admin-pill--active';
  return 'admin-pill admin-pill--neutral';
}

export function SchoolAdminUserHelpPanel() {
  const { data: queries = [], isLoading, error } = useQuery({
    queryKey: ['school-admin', 'user-help'],
    queryFn: () => schoolAdminUserHelpService.getAll(),
  });

  if (isLoading) {
    return (
      <div className="admin-loading-state">
        <div className="spinner-border spinner-border-sm text-secondary mb-2" role="status" />
        <p className="mb-0">Loading user help queries…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-notice mb-0">
        <p className="admin-form-hint admin-form-hint--error mb-0">
          {error instanceof Error ? error.message : 'Failed to load user help queries.'}
        </p>
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="admin-empty-state">
        <i className="bi bi-question-circle d-block mb-3" style={{ fontSize: '2.5rem', color: '#94a3b8' }} aria-hidden />
        <p className="mb-1">No user queries yet.</p>
        <p className="admin-form-hint mb-0">
          When app users raise a query from the Help screen, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="admin-help-query-list list-unstyled mb-0">
      {queries.map((q: UserHelpQueryForAdmin) => (
        <li key={q.id} className="admin-help-query-list__item">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <span className="admin-table__strong">{q.user?.name ?? 'Unknown'}</span>
              {q.user?.email ? <span className="text-muted small ms-2">{q.user.email}</span> : null}
            </div>
            <span className={statusPillClass(q.status)}>{q.status}</span>
          </div>
          <p className="admin-form-hint mb-2 mt-1">{formatDate(q.createdAt)}</p>
          <p className="mb-0" style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: 1.5 }}>
            {q.message}
          </p>
        </li>
      ))}
    </ul>
  );
}
