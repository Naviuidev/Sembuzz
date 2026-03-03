import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdsAdminAuth } from '../contexts/AdsAdminAuthContext';

export const AdsAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdsAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user?.isFirstLogin) {
        navigate('/ads-admin/set-password', { replace: true });
      } else {
        navigate('/ads-admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen d-flex" style={{ backgroundColor: '#fafafa' }}>
      <div className="d-flex align-items-center justify-content-center" style={{ flex: 1, padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>SemBuzz</h1>
          <h2 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>Ads Admin Portal</h2>
          <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '2rem' }}>
            Sign in to manage banner and sponsored ads for your school.
          </p>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" style={{ borderRadius: '0px' }}>
                {error}
              </div>
            )}
            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ads@school.edu"
                required
                style={{ borderRadius: '0px', padding: '0.75rem' }}
              />
            </div>
            <div className="mb-4">
              <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>Password</label>
              <p className="text-muted small mb-1">Use your temporary password for first-time login; you will be asked to set a new password.</p>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ borderRadius: '0px', padding: '0.75rem' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn w-100"
              style={{
                backgroundColor: '#1a1f2e',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem',
                color: '#fff',
                fontWeight: '500',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="mt-3 mb-0" style={{ fontSize: '0.875rem', color: '#6c757d' }}>
            <a href="/ads-admin/forgot-password" style={{ color: '#1a1f2e' }}>Forgot password?</a>
          </p>
        </div>
      </div>
    </div>
  );
}
