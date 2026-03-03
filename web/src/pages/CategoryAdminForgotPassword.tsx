import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';

export const CategoryAdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevOtp(undefined);
    setLoading(true);

    try {
      const response = await api.post('/category-admin/auth/forgot-password/request-otp', { email: email.trim() });
      const data = response.data as { email?: string; devOtp?: string };
      setDevOtp(data.devOtp);
      setSuccess(data.devOtp ? `OTP: ${data.devOtp} (use this if email was not sent)` : `OTP has been sent to ${data.email}`);
      setTimeout(() => {
        navigate('/category-admin/forgot-password/verify-otp', { state: { email: email.trim(), devOtp: data.devOtp } });
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Failed to send OTP. Please try again.';
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
            Forgot Password
          </h2>

          <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '2rem' }}>
            Enter your registered email (Gmail) to receive an OTP
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
                {devOtp && (
                  <div className="mt-2">
                    <strong>Development OTP:</strong> <code style={{ fontSize: '1.1rem', letterSpacing: '0.15em' }}>{devOtp}</code>
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your registered Gmail"
                style={{
                  borderRadius: '0px',
                  padding: '0.75rem 1rem',
                  border: '1px solid #dee2e6',
                  width: '100%',
                }}
              />
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
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="text-center mt-3">
              <a href="/category-admin/login" style={{ color: '#1a1f2e', textDecoration: 'none', fontSize: '0.9rem' }}>
                Back to Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
