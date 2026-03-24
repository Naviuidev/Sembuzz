import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useUserAuth } from '../contexts/UserAuthContext';
import { userAuthService } from '../services/user-auth.service';
import { isMobileBrowser, openSembuzzAppWithToken } from '../utils/openSembuzzApp';
import type { SchoolOption } from '../services/user-auth.service';

type Step = 'method' | 'form' | 'otp' | 'pending';
type RegistrationMethod = 'school_domain' | 'gmail' | null;

function getMethodFromLocation(location: { search: string; state?: unknown }): RegistrationMethod {
  const fromState = (location.state as { registrationMethod?: 'school_domain' | 'gmail' })?.registrationMethod;
  const fromQuery = new URLSearchParams(location.search).get('method');
  const method = fromState ?? (fromQuery === 'school_domain' || fromQuery === 'gmail' ? fromQuery : null);
  return method;
}

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register: doRegister, isAuthenticated } = useUserAuth();
  const initialMethod = getMethodFromLocation(location);
  const [step, setStep] = useState<Step>(() => (initialMethod ? 'form' : 'method'));
  const [registrationMethod, setRegistrationMethod] = useState<RegistrationMethod>(() => initialMethod);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolId: '',
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  const selectedDomain = formData.schoolId
    ? schools.find((s) => s.id === formData.schoolId)?.domain ?? null
    : null;

  useEffect(() => {
    setSchoolsError(null);
    userAuthService
      .getSchools()
      .then((data) => {
        setSchools(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setSchools([]);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Unable to load schools. Check that the backend is running and try again.';
        setSchoolsError(typeof msg === 'string' ? msg : 'Failed to load schools.');
      })
      .finally(() => setSchoolsLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/events', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // When location gets method (e.g. user navigated with state or URL changed), skip method step
  useEffect(() => {
    const method = getMethodFromLocation(location);
    if (method === 'school_domain' || method === 'gmail') {
      setRegistrationMethod(method);
      setStep('form');
    }
  }, [location.state, location.search]);

  // Direct visit to /register (no method chosen) → show signup popup on events page instead of full register page
  useEffect(() => {
    const hasMethod = !!getMethodFromLocation(location);
    if (!hasMethod && step === 'method') {
      navigate('/events', { replace: true, state: { openAuth: 'signup', bottomNav: 'settings' } });
    }
  }, [location, step, navigate]);

  const handleMethodSelect = (method: 'school_domain' | 'gmail') => {
    setRegistrationMethod(method);
    setStep('form');
    setError('');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!formData.schoolId) {
      setError('Please select your school');
      return;
    }
    if (!registrationMethod) {
      setError('Please choose how you are able to create an account');
      return;
    }
    if (registrationMethod === 'gmail' && !verificationFile) {
      setError('Please upload a school-related document (e.g. ID card or fee receipt)');
      return;
    }

    setLoading(true);
    try {
      let profilePicUrl: string | undefined;
      let verificationDocUrl: string | undefined;
      if (profileFile) {
        const profileRes = await userAuthService.uploadProfilePic(profileFile);
        profilePicUrl = profileRes.url;
      }
      if (verificationFile) {
        const docRes = await userAuthService.uploadRegistrationDoc(verificationFile);
        verificationDocUrl = docRes.url;
      }
      const response = await doRegister({
        registrationMethod,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        profilePicUrl,
        schoolId: formData.schoolId,
        email: formData.email.trim(),
        password: formData.password,
        verificationDocUrl,
      });

      if ('requiresOtp' in response && response.requiresOtp) {
        setOtpEmail(response.email);
        const showDevOtp = import.meta.env.DEV && response.devOtp;
        setDevOtp(showDevOtp ? response.devOtp : undefined);
        setStep('otp');
        setOtpValue(showDevOtp && response.devOtp ? response.devOtp : '');
      } else if ('pendingApproval' in response && response.pendingApproval) {
        setStep('pending');
      } else if ('access_token' in response && response.access_token) {
        const t =
          typeof localStorage !== 'undefined' ? localStorage.getItem('user-token') : null;
        if (t && isMobileBrowser()) {
          openSembuzzAppWithToken(t);
        }
        navigate('/events', { replace: true, state: { openAuth: 'login', bottomNav: 'settings' } });
      }
    } catch (err: unknown) {
      const ax = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string | string[] }; status?: number }; message?: string })
        : null;
      const data = ax?.response?.data;
      const rawMessage =
        (data && typeof data === 'object' && 'message' in data && data.message) ||
        (typeof data === 'string' ? data : null);
      const msg = Array.isArray(rawMessage)
        ? rawMessage.join('. ')
        : typeof rawMessage === 'string' && rawMessage.length > 0
          ? rawMessage
          : ax?.message ||
            (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
              ? (err as { message: string }).message
              : 'Registration failed. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpValue || otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP sent to your email');
      return;
    }
    setLoading(true);
    try {
      await userAuthService.verifyOtp(otpEmail, otpValue);
      navigate('/events', { replace: true, state: { openAuth: 'login', bottomNav: 'settings', message: 'Account created. Please log in with your email and password.' } });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Invalid or expired OTP. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);
    try {
      const res = await userAuthService.resendOtp(otpEmail);
      if (import.meta.env.DEV && res.devOtp) {
        setDevOtp(res.devOtp);
        setOtpValue(res.devOtp);
      }
      setError('');
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Could not resend OTP. Try again.';
      setError(typeof msg === 'string' ? msg : 'Could not resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp' || step === 'pending') {
      setStep('form');
      setError('');
    } else if (step === 'form') {
      // Came from signup popup on /events (state had registrationMethod) → go back to popup, not full-page method step
      const cameFromPopup = !!(location.state as { registrationMethod?: string })?.registrationMethod;
      if (cameFromPopup) {
        navigate('/events', { state: { openAuth: 'signup', bottomNav: 'settings' } });
        return;
      }
      setStep('method');
      setRegistrationMethod(null);
      setProfileFile(null);
      setVerificationFile(null);
      setError('');
    }
  };

  return (
    <div className="min-h-screen contact-page-bg">
      <Navbar />

      <div className="container py-5" style={{ paddingBottom: '5rem' }}>
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0" style={{ borderRadius: '12px', backgroundColor: 'transparent', boxShadow: 'none' }}>
              <div className="card-body p-5">
                {step === 'method' && (
                  <>
                    <h2
                      className="text-center mb-3"
                      style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1a1f2e' }}
                    >
                      How are you able to create an account?
                    </h2>
                    <p className="text-center text-muted mb-4">
                      Choose the option that applies to you. This helps us verify your identity.
                    </p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <button
                          type="button"
                          className="btn btn-outline-primary w-100 py-4 d-flex flex-column align-items-center"
                          style={{ borderRadius: '12px', borderWidth: '2px' }}
                          onClick={() => handleMethodSelect('school_domain')}
                        >
                          <i className="bi bi-building" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                          <span className="fw-600">School domain</span>
                          <small className="text-muted mt-1 text-center">
                            I have an email with my school&apos;s domain (e.g. @sembuzz.com)
                          </small>
                        </button>
                      </div>
                      <div className="col-md-6">
                        <button
                          type="button"
                          className="btn btn-outline-secondary w-100 py-4 d-flex flex-column align-items-center"
                          style={{ borderRadius: '12px', borderWidth: '2px' }}
                          onClick={() => handleMethodSelect('gmail')}
                        >
                          <i className="bi bi-google" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                          <span className="fw-600">Gmail / Yahoo / other</span>
                          <small className="text-muted mt-1 text-center">
                            I will use a personal email (Gmail, Yahoo, etc.); upload a school doc for admin approval
                          </small>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {step === 'form' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1a1f2e', marginBottom: 0 }}>
                        Create your account
                      </h2>
                      <button type="button" className="btn btn-link text-muted p-0" onClick={goBack}>
                        Back
                      </button>
                    </div>
                    <p className="text-muted small mb-3">
                      {registrationMethod === 'school_domain'
                        ? 'Use an email address that matches your school’s domain (e.g. you@yourschool.com). We’ll send a one-time password to verify.'
                        : 'Upload a school document (ID card or fee receipt). Your school admin will review it and approve your account before you can log in.'}
                    </p>

                    <form onSubmit={handleSubmitForm}>
                      {error && (
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      )}

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ fontWeight: '500' }}>
                            First name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            style={{ borderRadius: '8px', padding: '0.75rem' }}
                            placeholder="John"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label" style={{ fontWeight: '500' }}>
                            Last name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            style={{ borderRadius: '8px', padding: '0.75rem' }}
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label" style={{ fontWeight: '500' }}>
                          Profile picture <span className="text-muted">(optional)</span>
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          accept=".jpg,.jpeg,.png,.gif,.webp"
                          onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
                          style={{ borderRadius: '8px', padding: '0.75rem' }}
                        />
                        <small className="text-muted">Upload an image (JPG, PNG, GIF, WebP)</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label" style={{ fontWeight: '500' }}>
                          School
                        </label>
                        <select
                          className="form-select"
                          required
                          value={formData.schoolId}
                          onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.75rem' }}
                          disabled={schoolsLoading}
                        >
                          <option value="">Select your school</option>
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                              {s.domain ? ` (${s.domain})` : ''}
                            </option>
                          ))}
                        </select>
                        {schoolsLoading && <small className="text-muted d-block mt-1">Loading schools…</small>}
                        {schoolsError && (
                          <div className="alert alert-warning mt-2 mb-0 py-2" style={{ borderRadius: '8px', fontSize: '0.9rem' }}>
                            {schoolsError}
                          </div>
                        )}
                        {!schoolsLoading && !schoolsError && schools.length === 0 && (
                          <small className="text-muted d-block mt-1">No schools available. Schools must be created by an administrator first.</small>
                        )}
                      </div>

                      {registrationMethod === 'gmail' && (
                        <div className="mb-3">
                          <label className="form-label" style={{ fontWeight: '500' }}>
                            School document <span className="text-danger">*</span>
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            accept=".pdf,.jpg,.jpeg,.png,.heic"
                            required={registrationMethod === 'gmail'}
                            onChange={(e) => setVerificationFile(e.target.files?.[0] ?? null)}
                            style={{ borderRadius: '8px', padding: '0.75rem' }}
                          />
                          <small className="text-muted">
                            Upload a school-related document (e.g. ID card, fee receipt, enrollment proof). Your school admin will verify it before approving your account.
                          </small>
                        </div>
                      )}
                      {registrationMethod === 'school_domain' && (
                        <div className="mb-3">
                          <label className="form-label" style={{ fontWeight: '500' }}>
                            School verification document <span className="text-muted">(optional)</span>
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            accept=".pdf,.jpg,.jpeg,.png,.heic"
                            onChange={(e) => setVerificationFile(e.target.files?.[0] ?? null)}
                            style={{ borderRadius: '8px', padding: '0.75rem' }}
                          />
                          <small className="text-muted">
                            Upload a school-related document (e.g. ID card, fee receipt) to save with your profile.
                          </small>
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="form-label" style={{ fontWeight: '500' }}>
                          Email address
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.75rem' }}
                          placeholder={
                            registrationMethod === 'school_domain' && selectedDomain
                              ? `you@${selectedDomain}`
                              : 'you@example.com'
                          }
                        />
                        {registrationMethod === 'school_domain' && selectedDomain && (
                          <small className="text-muted">Use an email ending with @{selectedDomain}</small>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label" style={{ fontWeight: '500' }}>
                          Password
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          required
                          minLength={6}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.75rem' }}
                          placeholder="••••••••"
                        />
                        <small className="text-muted">At least 6 characters</small>
                      </div>

                      <div className="mb-4">
                        <label className="form-label" style={{ fontWeight: '500' }}>
                          Confirm password
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          style={{ borderRadius: '8px', padding: '0.75rem' }}
                          placeholder="••••••••"
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-dark rounded-pill w-100"
                        disabled={loading || schoolsLoading}
                        style={{ padding: '0.75rem', fontWeight: '600' }}
                      >
                        {loading ? 'Submitting...' : 'Register'}
                      </button>
                    </form>
                  </>
                )}

                {step === 'otp' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1a1f2e', marginBottom: 0 }}>
                        Verify your email
                      </h2>
                      <button type="button" className="btn btn-link text-muted p-0" onClick={goBack}>
                        Back
                      </button>
                    </div>
                    <p className="text-muted mb-4">
                      We sent a 6-digit one-time password to <strong>{otpEmail}</strong>. Enter it below. Check your spam folder if you don&apos;t see it.
                    </p>
                    {import.meta.env.DEV && devOtp && (
                      <div className="alert alert-info mb-3" role="alert" style={{ borderRadius: '8px' }}>
                        <strong>Development:</strong> Email may not be sent. Use this OTP: <code style={{ fontSize: '1.25rem', letterSpacing: '0.2em' }}>{devOtp}</code>
                      </div>
                    )}
                    {(!devOtp || !import.meta.env.DEV) && (
                      <p className="small text-muted mb-3" style={{ backgroundColor: '#f0f4f8', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                        If you didn&apos;t receive the email, check your spam folder or click <strong>Resend OTP</strong> below.
                      </p>
                    )}
                    <form onSubmit={handleSubmitOtp}>
                      {error && (
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      )}
                      {resendSuccess && (
                        <div className="alert alert-success" role="alert">
                          A new OTP was sent to your email. Check your inbox (and spam).
                        </div>
                      )}
                      <div className="mb-4">
                        <label className="form-label" style={{ fontWeight: '500' }}>
                          One-time password
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg text-center"
                          maxLength={6}
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                          style={{ borderRadius: '8px', letterSpacing: '0.5rem', fontSize: '1.5rem' }}
                          placeholder="000000"
                          autoComplete="one-time-code"
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary w-100 mb-2"
                        disabled={loading || otpValue.length !== 6}
                        style={{
                          backgroundColor: '#4dabf7',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        {loading ? 'Verifying...' : 'Verify and create account'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary w-100"
                        disabled={resendLoading || loading}
                        onClick={handleResendOtp}
                        style={{ borderRadius: '8px', padding: '0.75rem' }}
                      >
                        {resendLoading ? 'Sending...' : 'Resend OTP'}
                      </button>
                    </form>
                  </>
                )}

                {step === 'pending' && (
                  <>
                    <div className="text-center py-3">
                      <i
                        className="bi bi-hourglass-split text-warning"
                        style={{ fontSize: '3rem', marginBottom: '1rem' }}
                      />
                      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1a1f2e', marginBottom: '1rem' }}>
                        Pending approval
                      </h2>
                      <p className="text-muted mb-4">
                        Your registration has been sent to your school admin. You will be able to log in once they
                        approve your account. We’ll use the same email and password you just set.
                      </p>
                      <button
                        type="button"
                        className="btn btn-outline-dark rounded-pill"
                        style={{ borderRadius: '8px' }}
                        onClick={() => navigate('/events', { state: { openAuth: 'login', bottomNav: 'settings' } })}
                      >
                        Go to login
                      </button>
                    </div>
                  </>
                )}

                {step !== 'method' && step !== 'pending' && (
                  <p className="text-center text-muted mt-4 mb-0">
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0 bg-transparent text-decoration-none"
                      style={{ color: '#000', cursor: 'pointer' }}
                      onClick={() => navigate('/events', { state: { openAuth: 'login', bottomNav: 'settings' } })}
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navbar — visible during school domain & custom domain signup for easy navigation */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1030,
          display: 'flex',
          justifyContent: 'center',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        }}
      >
        <div
          className="bottom-nav-bar bottom-nav-white"
          style={{ width: '100%', maxWidth: '600px' }}
        >
          <div className="d-flex justify-content-between align-items-center py-2 px-2">
            <button
              type="button"
              className="bottom-nav-btn"
              aria-label="Search"
              onClick={() => navigate('/events', { state: { bottomNav: 'search' } })}
            >
              <i className="bi bi-search" style={{ fontSize: '1.35rem' }} />
            </button>
            <button
              type="button"
              className="bottom-nav-btn"
              aria-label="Home"
              onClick={() => navigate('/events')}
            >
              <i className="bi bi-house-door" style={{ fontSize: '1.35rem' }} />
            </button>
            <button
              type="button"
              className="bottom-nav-btn"
              aria-label="Settings"
              onClick={() => navigate('/events', { state: { bottomNav: 'settings' } })}
            >
              <i className="bi bi-gear" style={{ fontSize: '1.35rem' }} />
            </button>
            <button
              type="button"
              className="bottom-nav-btn"
              aria-label="Apps"
              onClick={() => navigate('/events', { state: { bottomNav: 'apps' } })}
            >
              <i className="bi bi-grid-3x3-gap" style={{ fontSize: '1.35rem' }} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .bottom-nav-bar.bottom-nav-white {
          background: #fff;
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          box-shadow: 0 -2px 16px rgba(0,0,0,0.08);
        }
        .bottom-nav-bar.bottom-nav-white .bottom-nav-btn {
          background: none;
          border: none;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          color: #1a1f2e;
          transition: color 0.2s ease, background 0.3s ease, box-shadow 0.3s ease, opacity 0.2s ease;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .bottom-nav-bar.bottom-nav-white .bottom-nav-btn:hover {
          color: #d5d1c3;
        }
      `}</style>
    </div>
  );
};
