import { type FormEvent, useEffect, useState } from 'react';
import { StatusPopup } from './StatusPopup';
import type { AdminEmailChangeRequest } from '../services/admin-email-change-requests.service';

type Step = 'email' | 'otp' | 'success';

type ConfigureAdminEmailModalProps = {
  show: boolean;
  request: AdminEmailChangeRequest | null;
  onClose: () => void;
  onConfigureEmail: (requestId: string, newEmail: string) => Promise<{ maskedEmail: string }>;
  onConfirmNewEmail: (requestId: string, otp: string) => Promise<{ newEmail: string; welcomeEmailSent?: boolean }>;
};

export function ConfigureAdminEmailModal({
  show,
  request,
  onClose,
  onConfigureEmail,
  onConfirmNewEmail,
}: ConfigureAdminEmailModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusPopup, setStatusPopup] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (show && request) {
      if (request.status === 'pending_new_email_otp' && request.proposedNewEmail) {
        setStep('otp');
        setNewEmail(request.proposedNewEmail);
        const at = request.proposedNewEmail.indexOf('@');
        setMaskedEmail(
          at > 0
            ? `${request.proposedNewEmail.slice(0, 3)}***${request.proposedNewEmail.slice(at)}`
            : request.proposedNewEmail,
        );
      } else {
        setStep('email');
        setNewEmail('');
        setMaskedEmail('');
      }
      setOtp('');
      setError(null);
    }
  }, [show, request]);

  const reset = () => {
    setStep('email');
    setNewEmail('');
    setOtp('');
    setMaskedEmail('');
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!show || !request) return null;

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim();
    if (!trimmed) {
      setError('Email is required.');
      return;
    }
    if (trimmed.toLowerCase() === request.targetEmail.toLowerCase()) {
      setError('New email must be different from the current email.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await onConfigureEmail(request.id, trimmed);
      setMaskedEmail(result.maskedEmail);
      setStep('otp');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : null;
      setError(Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError('Enter the 6-digit OTP from the new email.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await onConfirmNewEmail(request.id, trimmedOtp);
      setStep('success');
      setStatusPopup({
        type: 'success',
        message: result.welcomeEmailSent
          ? `Email updated to ${result.newEmail}. A welcome email with a temporary password was sent. The admin must log in and create a new password. All existing roles and access are unchanged.`
          : `Email updated to ${result.newEmail}. Share the new login details with the admin manually. They will be prompted to create a new password on login.`,
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : null;
      setError(Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
        onClick={handleClose}
      >
        <div
          className="card border-0 shadow"
          style={{ maxWidth: '440px', width: '92%', borderRadius: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h3 className="h5 mb-1" style={{ color: '#1a1f2e' }}>
                  Configure email
                </h3>
                <p className="small text-muted mb-0">
                  For <strong>{request.targetName}</strong> (current: {request.targetEmail})
                </p>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} />
            </div>

            {step === 'email' ? (
              <form onSubmit={(e) => void handleEmailSubmit(e)}>
                <label className="form-label small text-secondary">New email address</label>
                <input
                  type="email"
                  className="form-control mb-3"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                />
                <p className="small text-muted">
                  A verification OTP will be sent to this email. All existing roles and access stay
                  linked to the same User ID.
                </p>
                {error ? <div className="alert alert-danger py-2 small">{error}</div> : null}
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                    {loading ? 'Sending…' : 'Send OTP to new email'}
                  </button>
                </div>
              </form>
            ) : step === 'otp' ? (
              <form onSubmit={(e) => void handleOtpSubmit(e)}>
                <p className="small text-muted mb-3">
                  Enter the 6-digit OTP sent to <strong>{maskedEmail || newEmail}</strong>.
                </p>
                <label className="form-label small text-secondary">OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="form-control mb-3 font-monospace"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                {error ? <div className="alert alert-danger py-2 small">{error}</div> : null}
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setError(null);
                    }}
                  >
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                    {loading ? 'Updating…' : 'Verify & update email'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-2">
                <i className="bi bi-check-circle text-success" style={{ fontSize: '2.5rem' }} />
                <p className="mt-3 mb-0">Email updated successfully.</p>
                <button type="button" className="btn btn-primary btn-sm mt-3" onClick={handleClose}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <StatusPopup
        show={!!statusPopup}
        type={statusPopup?.type ?? 'success'}
        message={statusPopup?.message ?? ''}
        onClose={() => {
          setStatusPopup(null);
          if (step === 'success') handleClose();
        }}
      />
    </>
  );
}
