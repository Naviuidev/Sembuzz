import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { userAuthService } from '../services/user-auth.service';

export const VerifyApproval = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Invalid or missing link. Please use the link from your approval email.');
      return;
    }
    setError('');
    userAuthService
      .verifyApproval(token)
      .then((data) => {
        if (data.success) setSuccess(true);
        else setError('Invalid or expired link. Please use the latest link from your email.');
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
                    <p className="mt-2 mb-0 text-muted">Verifying your email…</p>
                  </div>
                )}

                {!loading && error && !success && (
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
                      onClick={() => navigate('/events', { state: { openAuth: 'login', bottomNav: 'settings' } })}
                    >
                      Go to login
                    </button>
                  </div>
                )}

                {!loading && success && (
                  <div className="text-center py-3">
                    <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }} />
                    <h2 className="h5 mt-3" style={{ color: '#1a1f2e' }}>
                      Email verified
                    </h2>
                    <p className="text-muted mb-4">
                      Your account is now active. You can log in with your email and password.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ borderRadius: '8px' }}
                      onClick={() => navigate('/events', { state: { openAuth: 'login', bottomNav: 'settings' } })}
                    >
                      Log in
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
