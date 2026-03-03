import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdsAdminAuth } from '../contexts/AdsAdminAuthContext';

export const AdsAdminSetPassword = () => {
  const { user, isAuthenticated, loading, changePassword } = useAdsAdminAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/ads-admin/login', { replace: true });
      return;
    }
    if (!loading && isAuthenticated && user && !user.isFirstLogin) {
      navigate('/ads-admin/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setLoadingSubmit(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword, { skipLogout: true });
      navigate('/ads-admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to set password. Please try again.');
      setLoadingSubmit(false);
    }
  };

  if (loading || (isAuthenticated && user && !user.isFirstLogin)) {
    return (
      <div className="d-flex align-items-center justify-content-center min-h-screen" style={{ backgroundColor: '#fafafa' }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fafafa' }}>
      <div style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>SemBuzz</h1>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
          Set new password
        </h2>
        <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '1.5rem' }}>
          This is your first login. Enter your temporary password below and choose a new password to continue.
        </p>

        <div className="alert alert-info border-0 mb-4" style={{ borderRadius: '0px', fontSize: '0.875rem' }}>
          <strong>Instructions:</strong>
          <ul className="mb-0 mt-2 ps-3">
            <li>Enter the temporary password you received</li>
            <li>Your new password must be at least 8 characters long</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger mb-3" style={{ borderRadius: '0px' }}>
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
              Temporary password *
            </label>
            <div className="input-group">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                className="form-control"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter the password you received"
                style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
                style={{ borderRadius: '0px' }}
              >
                <i className={`bi ${showPasswords.current ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
              New password *
            </label>
            <div className="input-group">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                className="form-control"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                placeholder="At least 8 characters"
                style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPasswords((s) => ({ ...s, new: !s.new }))}
                style={{ borderRadius: '0px' }}
              >
                <i className={`bi ${showPasswords.new ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
              Confirm new password *
            </label>
            <div className="input-group">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                className="form-control"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                placeholder="Re-enter new password"
                style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
                style={{ borderRadius: '0px' }}
              >
                <i className={`bi ${showPasswords.confirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingSubmit}
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
            {loadingSubmit ? 'Setting password...' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  );
};
