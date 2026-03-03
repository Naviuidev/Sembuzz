import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { userAuthService } from '../services/user-auth.service';

export const UpdateVerificationDoc = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState<{ type: 'reupload' | 'additional'; email: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Invalid or missing link. Please use the link from your email.');
      return;
    }
    setError('');
    userAuthService
      .verifyUpdateDocToken(token)
      .then((data) => {
        if (data.valid) {
          setVerified({ type: data.type, email: data.email });
        } else {
          setError('Invalid or expired link. Please use the latest link from your email.');
        }
      })
      .catch((err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Invalid or expired link.';
        setError(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Invalid link.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !file || !verified) return;
    setError('');
    setSubmitting(true);
    try {
      await userAuthService.submitUpdateDoc(token, file);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Upload failed. Please try again.';
      setError(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-5">
                {loading && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-2 mb-0 text-muted">Verifying your link…</p>
                  </div>
                )}

                {!loading && error && !verified && (
                  <div className="text-center py-3">
                    <i className="bi bi-exclamation-circle text-danger" style={{ fontSize: '3rem' }} />
                    <h2 className="h5 mt-3" style={{ color: '#1a1f2e' }}>
                      Invalid or expired link
                    </h2>
                    <p className="text-muted mb-4">{error}</p>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      style={{ borderRadius: '8px' }}
                      onClick={() => navigate('/events', { state: { openAuth: 'signup', bottomNav: 'settings' } })}
                    >
                      Go to registration
                    </button>
                  </div>
                )}

                {!loading && verified && success && (
                  <div className="text-center py-3">
                    <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }} />
                    <h2 className="h5 mt-3" style={{ color: '#1a1f2e' }}>
                      Document submitted
                    </h2>
                    <p className="text-muted mb-4">
                      Your {verified.type === 'additional' ? 'additional ' : ''}document has been received. Your school admin will review it and you’ll be able to log in once approved.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ borderRadius: '8px' }}
                      onClick={() => navigate('/events', { state: { openAuth: 'login', bottomNav: 'settings' } })}
                    >
                      Go to login
                    </button>
                  </div>
                )}

                {!loading && verified && !success && (
                  <>
                    <h2 className="mb-2" style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1a1f2e' }}>
                      {verified.type === 'additional' ? 'Upload additional document' : 'Re-upload document clearly'}
                    </h2>
                    <p className="text-muted small mb-4">
                      For account ending with <strong>{verified.email}</strong>. Upload a clear school-related document (e.g. ID card, fee receipt).
                    </p>
                    {error && (
                      <div className="alert alert-danger" role="alert" style={{ borderRadius: '8px' }}>
                        {error}
                      </div>
                    )}
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label className="form-label" style={{ fontWeight: '500' }}>
                          Select document
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          accept=".pdf,.jpg,.jpeg,.png,.heic"
                          required
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          style={{ borderRadius: '8px', padding: '0.75rem' }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={submitting || !file}
                        style={{
                          borderRadius: '8px',
                          padding: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: '#1a1f2e',
                          border: 'none',
                        }}
                      >
                        {submitting ? 'Uploading…' : 'Submit document'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
