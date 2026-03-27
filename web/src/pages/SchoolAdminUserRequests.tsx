import { useState, useEffect } from 'react';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import {
  schoolAdminPendingUsersService,
  type PendingUser,
} from '../services/school-admin-pending-users.service';
import { imageSrc } from '../utils/image';

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

function getDocExt(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : '';
}

function getDocFilename(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const seg = clean.split('/').pop();
  return seg && seg.includes('.') ? seg : 'document';
}

export const SchoolAdminUserRequests = () => {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [reuploadUser, setReuploadUser] = useState<PendingUser | null>(null);
  const [reuploadMessage, setReuploadMessage] = useState('');
  const [reuploadType, setReuploadType] = useState<'reupload' | 'additional'>('reupload');
  const [reuploadSending, setReuploadSending] = useState(false);
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);
  const [docPreviewFailed, setDocPreviewFailed] = useState(false);

  const fetchPending = () => {
    setLoading(true);
    setError(null);
    schoolAdminPendingUsersService
      .getPendingUsers()
      .then(setPending)
      .catch((err) => {
        const msg =
          err?.response?.data?.message || err?.message || 'Failed to load user requests.';
        setError(typeof msg === 'string' ? msg : 'Failed to load.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (user: PendingUser) => {
    setActioningId(user.id);
    try {
      await schoolAdminPendingUsersService.approve(user.id);
      setPending((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to approve.';
      setError(typeof msg === 'string' ? msg : 'Failed to approve.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDeny = async (user: PendingUser) => {
    setActioningId(user.id);
    setError(null);
    try {
      await schoolAdminPendingUsersService.reject(user.id);
      setPending((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to deny.';
      setError(typeof msg === 'string' ? msg : 'Failed to deny.');
    } finally {
      setActioningId(null);
    }
  };

  const handleRequestDocs = async (user: PendingUser) => {
    setActioningId(user.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await schoolAdminPendingUsersService.requestDocs(user.id);
      setSuccessMsg(`Verification-docs email sent to ${user.email}. You can still approve or deny directly.`);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to send request.';
      setError(typeof msg === 'string' ? msg : 'Failed to send request.');
    } finally {
      setActioningId(null);
    }
  };

  const openReuploadModal = (user: PendingUser) => {
    setReuploadUser(user);
    setReuploadMessage('');
    setReuploadType('reupload');
    setError(null);
  };

  const closeReuploadModal = () => {
    setReuploadUser(null);
    setReuploadMessage('');
    setReuploadType('reupload');
    setReuploadSending(false);
  };

  const handleAskReuploadSend = async () => {
    if (!reuploadUser || !reuploadMessage.trim()) return;
    setReuploadSending(true);
    setError(null);
    try {
      await schoolAdminPendingUsersService.askReupload(reuploadUser.id, reuploadMessage.trim(), reuploadType);
      setSuccessMsg(`Reupload request sent to ${reuploadUser.email}. They will receive your message.`);
      setTimeout(() => setSuccessMsg(null), 6000);
      closeReuploadModal();
    } catch (err: unknown) {
      const data = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data
        : null;
      const rawMessage = data?.message;
      const msg = Array.isArray(rawMessage)
        ? rawMessage.join('. ')
        : typeof rawMessage === 'string'
          ? rawMessage
          : 'Failed to send reupload request.';
      setError(msg);
    } finally {
      setReuploadSending(false);
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
              User requests
            </h1>
            <p
              style={{
                color: '#6c757d',
                fontSize: '1rem',
                marginBottom: 0,
              }}
            >
              Students who registered with Gmail/Yahoo (public email) and uploaded a school doc. View doc, approve, ask to reupload, or reject.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger mb-4" style={{ borderRadius: '0px' }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success mb-4" style={{ borderRadius: '0px' }}>
              {successMsg}
            </div>
          )}

          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-secondary" role="status" />
                  <p className="mt-2 mb-0" style={{ color: '#6c757d' }}>
                    Loading requests…
                  </p>
                </div>
              ) : pending.length === 0 ? (
                <div className="text-center py-5">
                  <i
                    className="bi bi-person-check"
                    style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }}
                  />
                  <p className="text-muted mb-0">No pending user requests.</p>
                  <p className="text-muted small mt-1">
                    When students register with Gmail, their requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th style={{ fontWeight: '600', color: '#1a1f2e', width: '56px' }}></th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Name</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Email</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Requested</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Doc</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e', width: '120px' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((user) => (
                        <tr key={user.id}>
                          <td className="align-middle">
                            {user.profilePicUrl ? (
                              <img
                                src={imageSrc(user.profilePicUrl)}
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
                            {user.firstName || user.lastName
                              ? [user.firstName, user.lastName].filter(Boolean).join(' ')
                              : user.name || '—'}
                          </td>
                          <td>{user.email}</td>
                          <td style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                            {formatDate(user.createdAt)}
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {user.verificationDocUrl ? (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  style={{ borderRadius: '6px' }}
                                  onClick={() => {
                                    setDocPreviewFailed(false);
                                    setViewDocUrl(user.verificationDocUrl);
                                  }}
                                  title="View document"
                                >
                                  <i className="bi bi-eye me-1" />
                                  View doc
                                </button>
                              ) : null}
                              {user.additionalVerificationDocUrl ? (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  style={{ borderRadius: '6px' }}
                                  onClick={() => {
                                    setDocPreviewFailed(false);
                                    setViewDocUrl(user.additionalVerificationDocUrl);
                                  }}
                                  title="View additional document"
                                >
                                  <i className="bi bi-eye me-1" />
                                  View additional
                                </button>
                              ) : null}
                              {!user.verificationDocUrl && !user.additionalVerificationDocUrl ? (
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  disabled={!!actioningId}
                                  onClick={() => handleRequestDocs(user)}
                                  style={{ borderRadius: '6px' }}
                                  title="Send email asking for document"
                                >
                                  {actioningId === user.id ? <span className="spinner-border spinner-border-sm" /> : 'Request docs'}
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              <button
                                type="button"
                                className="btn btn-outline-warning btn-sm p-2"
                                disabled={!!actioningId}
                                onClick={() => openReuploadModal(user)}
                                style={{ borderRadius: '6px' }}
                                title="Reupload (send email with message)"
                              >
                                <i className="bi bi-arrow-repeat" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm p-2"
                                disabled={!!actioningId}
                                onClick={() => handleApprove(user)}
                                style={{ borderRadius: '6px' }}
                                title="Approve"
                              >
                                {actioningId === user.id ? (
                                  <span className="spinner-border spinner-border-sm" style={{ width: '1rem', height: '1rem' }} />
                                ) : (
                                  <i className="bi bi-check-lg" />
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm p-2"
                                disabled={!!actioningId}
                                onClick={() => handleDeny(user)}
                                style={{ borderRadius: '6px' }}
                                title="Reject"
                              >
                                <i className="bi bi-x-lg" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* View doc modal */}
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
                    const resolvedUrl = imageSrc(viewDocUrl);
                    const ext = getDocExt(viewDocUrl);
                    const isPdf = ext === 'pdf';
                    const isBrowserImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
                    const needsFallback = docPreviewFailed || (!isPdf && !isBrowserImage);
                    const downloadName = getDocFilename(viewDocUrl);

                    if (needsFallback) {
                      return (
                        <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
                          <p className="mb-3 text-muted">
                            Preview is not supported for this file type
                            {ext ? ` (.${ext})` : ''}. Open or download the file instead.
                          </p>
                          <div className="d-flex gap-2">
                            <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                              Open document
                            </a>
                            <a href={resolvedUrl} download={downloadName} className="btn btn-outline-secondary btn-sm">
                              Download
                            </a>
                          </div>
                        </div>
                      );
                    }

                    if (isPdf) {
                      return (
                        <iframe
                          src={resolvedUrl}
                          title="Document"
                          style={{ width: '100%', height: 450, border: 'none' }}
                        />
                      );
                    }

                    return (
                      <img
                        src={resolvedUrl}
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

          {/* Ask to reupload modal */}
          {reuploadUser && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
              }}
              onClick={() => !reuploadSending && closeReuploadModal()}
            >
              <div
                className="card shadow-lg"
                style={{ minWidth: '400px', maxWidth: '500px', borderRadius: '0px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <h5 className="mb-3" style={{ color: '#1a1f2e' }}>
                    Request document from student
                  </h5>
                  <p className="text-muted small mb-3">
                    Your message will be sent to <strong>{reuploadUser.email}</strong>. Choose one option and add your clarification below.
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-600" style={{ color: '#1a1f2e' }}>
                      What should the student do?
                    </label>
                    <div className="d-flex flex-column gap-2">
                      <label className="d-flex align-items-center gap-2 p-2 rounded border cursor-pointer" style={{ cursor: 'pointer', borderColor: reuploadType === 'reupload' ? '#1a1f2e' : '#dee2e6' }}>
                        <input
                          type="radio"
                          name="reuploadType"
                          checked={reuploadType === 'reupload'}
                          onChange={() => setReuploadType('reupload')}
                        />
                        <span>Reupload the doc clearly</span>
                        <small className="text-muted">(e.g. clearer photo of ID card or fee receipt)</small>
                      </label>
                      <label className="d-flex align-items-center gap-2 p-2 rounded border" style={{ cursor: 'pointer', borderColor: reuploadType === 'additional' ? '#1a1f2e' : '#dee2e6' }}>
                        <input
                          type="radio"
                          name="reuploadType"
                          checked={reuploadType === 'additional'}
                          onChange={() => setReuploadType('additional')}
                        />
                        <span>Upload one more school-related doc</span>
                        <small className="text-muted">(e.g. fee receipt, enrollment letter)</small>
                      </label>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-600" style={{ color: '#1a1f2e' }}>
                      Your message (clarifications)
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Please upload a clearer copy of your ID card. The current document is not readable."
                      value={reuploadMessage}
                      onChange={(e) => setReuploadMessage(e.target.value)}
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={reuploadSending}
                      onClick={closeReuploadModal}
                      style={{ borderRadius: '50px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={reuploadSending || !reuploadMessage.trim()}
                      onClick={handleAskReuploadSend}
                      style={{ borderRadius: '50px' }}
                    >
                      {reuploadSending ? (
                        <span className="spinner-border spinner-border-sm me-1" />
                      ) : null}
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
