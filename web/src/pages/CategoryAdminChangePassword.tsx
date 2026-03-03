import { useState } from 'react';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { useNavigate } from 'react-router-dom';

export const CategoryAdminChangePassword = () => {
  const { changePassword, user } = useCategoryAdminAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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

    setLoading(true);

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      // After successful password change, logout and redirect to login
      alert('Password changed successfully! Please login again with your new password.');
      navigate('/category-admin/login');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to change password. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fafafa' }}>
      <div className="card border-0 shadow-sm" style={{ maxWidth: '500px', width: '100%', borderRadius: '0px' }}>
        <div className="card-body p-5">
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '1rem'
          }}>
            Change Password
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
            Welcome, {user?.name}! This is your first login. Please change your temporary password to continue.
          </p>

          <div className="alert alert-info" role="alert">
            <strong>Instructions:</strong>
            <ul className="mb-0 mt-2">
              <li>Your new password must be at least 8 characters long</li>
              <li>After changing your password, you will be logged out</li>
              <li>Please login again with your new password</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                Current Password (Temporary Password) *
              </label>
              <div className="input-group">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  className="form-control"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  style={{ borderRadius: '0px' }}
                >
                  <i className={`bi ${showPasswords.current ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                New Password *
              </label>
              <div className="input-group">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  className="form-control"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  style={{ borderRadius: '0px' }}
                >
                  <i className={`bi ${showPasswords.new ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                Confirm New Password *
              </label>
              <div className="input-group">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  className="form-control"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  style={{ borderRadius: '0px' }}
                >
                  <i className={`bi ${showPasswords.confirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn w-100"
              style={{
                backgroundColor: '#1a1f2e',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem 1.5rem',
                color: '#fff',
                fontWeight: '500',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.color = '#1a1f2e';
                  e.currentTarget.style.border = '1px solid #1a1f2e';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#1a1f2e';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.border = 'none';
                }
              }}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
