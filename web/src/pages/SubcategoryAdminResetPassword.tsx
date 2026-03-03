import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../config/api';

export const SubcategoryAdminResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email] = useState(location.state?.email || '');
  const [otp] = useState(location.state?.otp || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!email || !otp) {
      navigate('/subcategory-admin/forgot-password', { replace: true });
    }
  }, [email, otp, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await api.post('/subcategory-admin/auth/forgot-password/reset', {
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/subcategory-admin/login', { replace: true });
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })
        ?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Failed to reset password. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen d-flex" style={{ backgroundColor: 'white' }}>
      <div
        className="d-none d-md-flex align-items-center justify-content-center position-relative"
        style={{ width: '50%', minHeight: '100vh', backgroundColor: '#f8f9fa' }}
      >
        <img
          src="https://www.shutterstock.com/image-illustration/content-creating-concept-creator-making-600nw-2262002449.jpg"
          alt="Login Visual"
          className="img-fluid h-100 w-100"
          style={{ objectFit: 'cover' }}
        />
      </div>

      <div
        className="d-flex align-items-center justify-content-start"
        style={{ width: '50%', minHeight: '100vh', backgroundColor: '#fafafa', padding: '2rem' }}
      >
        <div style={{ width: '100%', maxWidth: '90%' }}>
          <div className="text-start mb-4">
            <h1 style={{ fontSize: '1rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
              SemBuzz
            </h1>
          </div>

          <h2 className="mb-3" style={{ fontSize: '3rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
            Reset Password
          </h2>

          <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '2rem' }}>
            Enter your new password
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                New Password
              </label>
              <div className="input-group">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  style={{
                    borderRadius: '0px',
                    padding: '0.75rem 1rem',
                    paddingRight: '3rem',
                    border: '1px solid #dee2e6',
                    width: '100%',
                  }}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ borderLeft: 'none', borderRadius: '0px', backgroundColor: 'white' }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                Confirm Password
              </label>
              <div className="input-group">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  style={{
                    borderRadius: '0px',
                    padding: '0.75rem 1rem',
                    paddingRight: '3rem',
                    border: '1px solid #dee2e6',
                    width: '100%',
                  }}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ borderLeft: 'none', borderRadius: '0px', backgroundColor: 'white' }}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'rgb(26, 31, 46)',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                color: '#fff',
                width: '100%',
                transition: 'all 0.3s',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = 'black';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgb(26, 31, 46, 0.32)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = 'rgb(26, 31, 46)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(26, 31, 46, 0.32)';
                }
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center mt-3">
              <a href="/subcategory-admin/login" style={{ color: '#1a1f2e', textDecoration: 'none', fontSize: '0.9rem' }}>
                Back to Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
