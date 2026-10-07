import { useState, useEffect } from 'react';
import {
  schoolAdminStudentsService,
  type SchoolStudent,
} from '../services/school-admin-students.service';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
  } catch {
    return iso;
  }
}

export function SchoolAdminApprovedUsersPanel() {
  const [users, setUsers] = useState<SchoolStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    schoolAdminStudentsService
      .getApproved()
      .then(setUsers)
      .catch((err) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        setError(msg || 'Failed to load approved users.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBan = async (s: SchoolStudent) => {
    setActioningId(s.id);
    try {
      await schoolAdminStudentsService.ban(s.id);
      setUsers((prev) => prev.map((u) => (u.id === s.id ? { ...u, status: 'banned' } : u)));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Failed to ban.');
    } finally {
      setActioningId(null);
    }
  };

  const handleUnban = async (s: SchoolStudent) => {
    setActioningId(s.id);
    try {
      await schoolAdminStudentsService.unban(s.id);
      setUsers((prev) => prev.map((u) => (u.id === s.id ? { ...u, status: 'active' } : u)));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Failed to unban.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <>
          {error && (
            <div className="alert alert-danger mb-4" style={{ borderRadius: '0px' }}>
              {error}
            </div>
          )}

          {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-secondary" />
                  <p className="mt-2 mb-0 text-muted">Loading…</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-person-check" style={{ fontSize: '3rem', color: '#6c757d' }} />
                  <p className="text-muted mb-0 mt-2">No approved users yet.</p>
                  <p className="text-muted small mt-1">
                    Users you approve from User requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Name</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Email</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Joined</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e', width: '140px' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((s) => (
                        <tr key={s.id}>
                          <td>
                            {[s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || '—'}
                          </td>
                          <td>{s.email}</td>
                          <td style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                            {formatDate(s.createdAt)}
                          </td>
                          <td>
                            {s.status === 'banned' ? (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                disabled={!!actioningId}
                                onClick={() => handleUnban(s)}
                                style={{ borderRadius: '6px' }}
                              >
                                {actioningId === s.id ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  'Unban'
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                disabled={!!actioningId}
                                onClick={() => handleBan(s)}
                                style={{ borderRadius: '6px' }}
                              >
                                Ban
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
    </>
  );
}
