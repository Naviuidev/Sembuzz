import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../config/api';

export const SubcategoryAdminVerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!email) {
      navigate('/subcategory-admin/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/subcategory-admin/auth/forgot-password/verify-otp', { email, otp });
      setSuccess('OTP verified successfully!');
      setTimeout(() => {
        navigate('/subcategory-admin/forgot-password/reset', { state: { email, otp } });
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })
        ?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Invalid OTP. Please try again.';
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
            Verify OTP
          </h2>

          <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '2rem' }}>
            Enter the 6-digit OTP sent to your registered email
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

            <div className="mb-4">
              <label htmlFor="otp" className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                OTP Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                style={{
                  borderRadius: '0px',
                  padding: '0.75rem 1rem',
                  border: '1px solid #dee2e6',
                  width: '100%',
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem',
                  textAlign: 'center',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{
                background: 'rgb(26, 31, 46)',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                color: '#fff',
                width: '100%',
                transition: 'all 0.3s',
                opacity: loading || otp.length !== 6 ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading && otp.length === 6) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = 'black';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgb(26, 31, 46, 0.32)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && otp.length === 6) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = 'rgb(26, 31, 46)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(26, 31, 46, 0.32)';
                }
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center mt-3">
              <a href="/subcategory-admin/forgot-password" style={{ color: '#1a1f2e', textDecoration: 'none', fontSize: '0.9rem' }}>
                Back
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
