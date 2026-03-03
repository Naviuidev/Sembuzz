import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';

export const SubCategoryAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useSubCategoryAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/subcategory-admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/subcategory-admin/dashboard', { replace: true });
    } catch (err: any) {
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
        className="d-none d-md-flex align-items-center justify-content-center position-relative"
        style={{
          width: '50%',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa'
        }}
      >
        <img 
          src="https://www.shutterstock.com/image-illustration/content-creating-concept-creator-making-600nw-2262002449.jpg" 
          alt="Login Visual" 
          className="img-fluid h-100 w-100" 
          style={{ objectFit: 'cover' }}
        />
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
            Subcategory Admin Portal
          </h2>

          <p style={{
            color: '#6c757d',
            fontSize: '1rem',
            marginBottom: '2rem'
          }}>
            Sign in to manage your subcategory
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="email" className="form-label" style={{
                fontWeight: '500',
                color: '#1a1f2e',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                style={{
                  borderRadius: '0px',
                  padding: '0.75rem 1rem',
                  border: '1px solid #dee2e6',
                  width: '100%'
                }}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label" style={{
                fontWeight: '500',
                color: '#1a1f2e',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <div className="input-group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  style={{
                    borderRadius: '0px',
                    padding: '0.75rem 1rem',
                    paddingRight: '3rem',
                    border: '1px solid #dee2e6',
                    width: '100%'
                  }}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    borderLeft: 'none',
                    borderRadius: '0px',
                    backgroundColor: 'white',
                    borderColor: '#dee2e6'
                  }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1rem' }}></i>
                </button>
              </div>
            </div>

            <div className="mb-4 text-end">
              <a 
                href="/subcategory-admin/forgot-password" 
                style={{ 
                  color: '#1a1f2e', 
                  textDecoration: 'none',
                  fontSize: '0.9rem'
                }}
              >
                Forgot Password?
              </a>
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
                transition: 'all 0.3s'
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
        </div>
      </div>
    </div>
  );
};
