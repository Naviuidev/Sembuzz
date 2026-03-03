import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/super-admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const logId = `LOGIN-${Date.now()}`;
    console.log(`[${logId}] === LOGIN FORM SUBMITTED ===`);
    console.log(`[${logId}] Email:`, email);
    console.log(`[${logId}] Password length:`, password.length);
    setError('');
    setLoading(true);

    try {
      console.log(`[${logId}] Attempting login...`);
      await login(email, password);
      console.log(`[${logId}] Login successful! Token saved to localStorage`);
      const savedToken = localStorage.getItem('token');
      console.log(`[${logId}] Current token check:`, savedToken ? `Token exists (${savedToken.substring(0, 20)}...)` : 'Token is NULL!');
      console.log(`[${logId}] Waiting a moment for state to update...`);
      
      // Give React time to update state before navigating
      setTimeout(() => {
        const tokenAfterDelay = localStorage.getItem('token');
        console.log(`[${logId}] Token after delay:`, tokenAfterDelay ? 'Still exists' : 'Gone!');
        console.log(`[${logId}] Navigating to dashboard...`);
        navigate('/super-admin/dashboard', { replace: true });
      }, 300);
    } catch (err: any) {
      console.error(`[${logId}] === LOGIN ERROR ===`);
      console.error(`[${logId}] Error object:`, err);
      console.error(`[${logId}] Error response:`, err.response);
      console.error(`[${logId}] Error response data:`, err.response?.data);
      console.error(`[${logId}] Error message:`, err.message);
      console.error(`[${logId}] Error status:`, err.response?.status);
      console.error(`[${logId}] Full error:`, JSON.stringify(err, null, 2));
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen d-flex" style={{ backgroundColor: 'white' }}>
      {/* Left Side - Image */}
      <div 
        className="d-none d-lg-block"
        style={{
          width: '50%',
          backgroundImage: 'url(https://www.shutterstock.com/image-illustration/content-creating-concept-creator-making-600nw-2262002449.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative'
        }}
      >
        {/* Optional overlay for better text readability if needed */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0)'
        }}></div>
      </div>

      {/* Right Side - Login Form */}
      <div 
        className="d-flex align-items-center justify-content-start"
        style={{
          width: '50%',
          minHeight: '100vh',
          backgroundColor: '#fafafa',
          padding: '2rem'
        }}
      >
        <div style={{ width: '100%', maxWidth: '90%' }}>
          {/* Brand Name */}
          <div className="text-start mb-4">
            <h1 style={{ 
              fontSize: '1rem', 
              fontWeight: 'normal',
              color: '#1a1f2e',
              marginBottom: '0.5rem'
            }}>
              SemBuzz
            </h1>
          </div>

          {/* Main Heading */}
          <h2 className="mb-3" style={{
            fontSize: '3rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '0.5rem'
          }}>
            Sembuzz Super Admin 
          </h2>

          {/* Sub-heading */}
          <p className="mb-4" style={{
            color: '#6c757d',
            fontSize: '1rem',
            marginBottom: '2rem'
          }}>
            Welcome back! Please enter your credentials to continue.
          </p>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert" style={{
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label" style={{
                fontWeight: '500',
                color: '#1a1f2e',
                marginBottom: '0.5rem'
              }}>
                Email | User Id
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email id or User Id"
                style={{
                  borderRadius: '0px',
                  padding: '0.75rem 1rem',
                  border: '1px solid #dee2e6',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label htmlFor="password" className="form-label" style={{
                fontWeight: '500',
                color: '#1a1f2e',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    borderRadius: '0px',
                    padding: '0.75rem 1rem',
                    paddingRight: '3rem',
                    border: '1px solid #dee2e6',
                    fontSize: '1rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6c757d',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn w-100"
              disabled={loading}
              style={{
                background: 'rgb(26, 31, 46)',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem 1.5rem',
                fontWeight: '600',
                color: '#fff',
                fontSize: '1rem',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(77, 171, 247, 0.3)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
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
              {loading ? 'Signing in...' : 'Submit'}
            </button>
          </form>

          {/* Bottom Text */}
          <div className="text-center mt-4" style={{
            color: '#6c757d',
            fontSize: '0.9rem'
          }}>
           
          </div>
        </div>
      </div>
    </div>
  );
};
