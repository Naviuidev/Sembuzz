import { useState, useEffect } from 'react';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
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

function getDocExt(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : '';
}

export const SchoolAdminAutomatedUsers = () => {
  const [users, setUsers] = useState<SchoolStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);
  const [docPreviewFailed, setDocPreviewFailed] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    schoolAdminStudentsService
      .getAutomated()
      .then(setUsers)
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load automated users.');
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
      const msg = err && typeof err === 'object' && 'response' in err
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
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(msg || 'Failed to unban.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="mb-4">
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 'normal',
                color: '#1a1f2e',
                marginBottom: '0.5rem',
              }}
            >
              Automated users
            </h1>
            <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
              Students who signed up with a school-domain email and verified via OTP. Ban to revoke login; unban to restore.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger mb-4" style={{ borderRadius: '0px' }}>
              {error}
            </div>
          )}

          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-secondary" />
                  <p className="mt-2 mb-0 text-muted">Loading…</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-people" style={{ fontSize: '3rem', color: '#6c757d' }} />
                  <p className="text-muted mb-0 mt-2">No automated users yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th style={{ fontWeight: '600', color: '#1a1f2e', width: '56px' }}></th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Name</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Email</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Joined</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Doc</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e', width: '140px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((s) => (
                        <tr key={s.id}>
                          <td className="align-middle">
                            {s.profilePicUrl ? (
                              <img
                                src={s.profilePicUrl}
                                alt=""
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  backgroundColor: '#e9ecef',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#6c757d',
                                  fontSize: '1rem',
                                }}
                                title="No photo"
                              >
                                <i className="bi bi-person-fill" />
                              </div>
                            )}
                          </td>
                          <td>
                            {[s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || '—'}
                          </td>
                          <td>{s.email}</td>
                          <td style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                            {formatDate(s.createdAt)}
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {s.verificationDocUrl ? (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  style={{ borderRadius: '6px' }}
                                  onClick={() => {
                                    setDocPreviewFailed(false);
                                    setViewDocUrl(s.verificationDocUrl!);
                                  }}
                                  title="View document"
                                >
                                  <i className="bi bi-eye me-1" />
                                  View doc
                                </button>
                              ) : null}
                              {s.additionalVerificationDocUrl ? (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  style={{ borderRadius: '6px' }}
                                  onClick={() => {
                                    setDocPreviewFailed(false);
                                    setViewDocUrl(s.additionalVerificationDocUrl!);
                                  }}
                                  title="View additional document"
                                >
                                  <i className="bi bi-eye me-1" />
                                  View additional
                                </button>
                              ) : null}
                              {!s.verificationDocUrl && !s.additionalVerificationDocUrl ? (
                                <span className="text-muted small">—</span>
                              ) : null}
                            </div>
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
            </div>
          </div>

          {/* View doc modal (same as user-requests) */}
          {viewDocUrl && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
              }}
              onClick={() => setViewDocUrl(null)}
            >
              <div
                className="card shadow-lg border-0"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  width: 700,
                  borderRadius: '0px',
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-header d-flex justify-content-between align-items-center py-2 px-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <span style={{ fontWeight: '600', color: '#1a1f2e' }}>View document</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-dark p-1"
                    onClick={() => setViewDocUrl(null)}
                    title="Close"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
                <div className="card-body p-0" style={{ minHeight: 400 }}>
                  {(() => {
                    const ext = getDocExt(viewDocUrl);
                    const isPdf = ext === 'pdf';
                    const isBrowserImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
                    const needsFallback = docPreviewFailed || (!isPdf && !isBrowserImage);

                    if (needsFallback) {
                      return (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
                          <p className="mb-3 text-muted">
                            Preview is not supported for this file type
                            {ext ? ` (.${ext})` : ''}. Open or download the file instead.
                          </p>
                          <div className="d-flex gap-2">
                            <a href={viewDocUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                              Open document
                            </a>
                            <a href={viewDocUrl} download className="btn btn-outline-secondary btn-sm">
                              Download
                            </a>
                          </div>
                        </div>
                      );
                    }

                    if (isPdf) {
                      return (
                        <iframe
                          src={viewDocUrl}
                          title="Document"
                          style={{ width: '100%', height: 450, border: 'none' }}
                        />
                      );
                    }

                    return (
                      <img
                        src={viewDocUrl}
                        alt="Uploaded document"
                        style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                        onError={() => setDocPreviewFailed(true)}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
