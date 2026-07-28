import { useState } from 'react';
import { userAuthService } from '../services/user-auth.service';
import { getApiErrorMessage } from '../utils/apiError';

type ForgotStep = 'email' | 'reset';

interface UserForgotPasswordPanelProps {
  initialEmail?: string;
  onBackToLogin: () => void;
  onSuccess?: () => void;
  compact?: boolean;
}

export function UserForgotPasswordPanel({
  initialEmail = '',
  onBackToLogin,
  onSuccess,
  compact = false,
}: UserForgotPasswordPanelProps) {
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    try {
      const data = await userAuthService.requestPasswordResetOtp(email.trim());
      setInfo(`OTP has been sent to ${data.email ?? 'your email'}.`);
      setStep('reset');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!otp.trim() || !newPassword || !confirmPassword) {
      setError('OTP and both password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    setLoading(true);
    try {
      await userAuthService.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });
      setInfo('Password reset successfully. You can sign in with your new password.');
      onSuccess?.();
      setTimeout(() => {
        onBackToLogin();
      }, 1200);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = compact
    ? { borderRadius: '10px', border: '1px solid #dee2e6' }
    : { borderRadius: '8px', padding: '0.75rem' };

  return (
    <div>
      <h2
        className={compact ? 'text-center mb-3' : 'mb-3'}
        style={{ fontSize: compact ? '1.15rem' : '1.5rem', fontWeight: 600, color: compact ? '#495057' : '#1a1f2e' }}
      >
        Forgot password
      </h2>
      <p className={compact ? 'small text-muted text-center mb-3' : 'text-muted mb-4'}>
        {step === 'email'
          ? 'Enter your registered email to receive a one-time password.'
          : 'Enter the OTP from your email and choose a new password.'}
      </p>

      {error ? <div className="small text-danger mb-2">{error}</div> : null}
      {info ? <div className="small text-success mb-2">{info}</div> : null}

      {step === 'email' ? (
        <form onSubmit={handleRequestOtp}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              autoComplete="email"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            className={`btn btn-dark ${compact ? 'rounded-pill w-100' : 'w-100'}`}
            disabled={loading}
            style={compact ? { borderRadius: '10px', fontWeight: 500, padding: '0.6rem 1rem' } : { fontWeight: 600 }}
          >
            {loading ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="OTP"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setError(null);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              style={inputStyle}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            className={`btn btn-dark ${compact ? 'rounded-pill w-100' : 'w-100'}`}
            disabled={loading}
            style={compact ? { borderRadius: '10px', fontWeight: 500, padding: '0.6rem 1rem' } : { fontWeight: 600 }}
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
          <button
            type="button"
            className="btn btn-link btn-sm w-100 mt-2 p-0 text-secondary text-decoration-none"
            onClick={() => {
              setStep('email');
              setOtp('');
              setNewPassword('');
              setConfirmPassword('');
              setError(null);
              setInfo(null);
            }}
            disabled={loading}
          >
            Resend OTP
          </button>
        </form>
      )}

      <button
        type="button"
        className="btn btn-link btn-sm w-100 mt-3 p-0 text-secondary text-decoration-none"
        onClick={onBackToLogin}
        disabled={loading}
      >
        Back to sign in
      </button>
    </div>
  );
}
