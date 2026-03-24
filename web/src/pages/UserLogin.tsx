import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useUserAuth } from '../contexts/UserAuthContext';
import { isMobileBrowser, openSembuzzAppWithToken } from '../utils/openSembuzzApp';

export const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useUserAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const successMessage = (location.state as { message?: string } | null)?.message;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/events', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const t = typeof localStorage !== 'undefined' ? localStorage.getItem('user-token') : null;
      if (t && isMobileBrowser()) {
        openSembuzzAppWithToken(t);
      }
      navigate('/events', { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Invalid email or password. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-5">
                <h2
                  className="text-center mb-4"
                  style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1f2e' }}
                >
                  Sign in to your account
                </h2>
                <p className="text-center text-muted mb-4">
                  Or{' '}
                  <Link to="/register" style={{ color: '#4dabf7', textDecoration: 'none' }}>
                    create a new account
                  </Link>
                </p>

                {successMessage && (
                  <div className="alert alert-success" role="alert">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label" style={{ fontWeight: '500' }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ borderRadius: '8px', padding: '0.75rem' }}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label" style={{ fontWeight: '500' }}>
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ borderRadius: '8px', padding: '0.75rem' }}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="remember-me" />
                      <label className="form-check-label" htmlFor="remember-me" style={{ fontSize: '0.9rem' }}>
                        Remember me
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                    style={{
                      backgroundColor: '#4dabf7',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontWeight: '600',
                    }}
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
