import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasterAdminAuth } from '../contexts/MasterAdminAuthContext';
import { defaultPortalPathForUser } from '../utils/masterAdminPortalAccess';
import { getApiErrorMessage } from '../utils/apiError';

export const MasterAdminSetPassword = () => {
  const { user, isAuthenticated, loading, setPassword } = useMasterAdminAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/master-admin/login', { replace: true });
      return;
    }
    if (!loading && user && user.role === 'school_master_admin' && !user.isFirstLogin) {
      navigate(defaultPortalPathForUser(user), { replace: true });
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
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await setPassword(currentPassword, newPassword, confirmPassword);
      navigate(defaultPortalPathForUser(updated), { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not set password.'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center min-h-screen">Loading…</div>;
  }

  return (
    <div className="min-h-screen d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fafafa' }}>
      <div style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <h1 className="admin-page-title mb-1">Create your password</h1>
        <p className="admin-form-hint mb-4">
          {user?.schoolName
            ? `First login for ${user.schoolName}. Use the temporary password from your email, then choose a new password.`
            : 'Use your temporary password, then choose a new password.'}
        </p>
        {error ? <p className="admin-form-hint admin-form-hint--error">{error}</p> : null}
        <form onSubmit={(e) => void handleSubmit(e)} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label" htmlFor="ma-temp-pass">
              Temporary password
            </label>
            <input
              id="ma-temp-pass"
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="ma-new-pass">
              New password
            </label>
            <input
              id="ma-new-pass"
              type="password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="ma-confirm-pass">
              Confirm new password
            </label>
            <input
              id="ma-confirm-pass"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="admin-btn-primary w-100" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  );
};
