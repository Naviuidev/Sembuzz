import { type FormEvent, useState } from 'react';
import { StatusPopup } from './StatusPopup';

type Step = 'reason' | 'otp' | 'success';

type AdminEmailChangeRequestModalProps = {
  show: boolean;
  adminName: string;
  currentEmail: string;
  onClose: () => void;
  onInitiate: (reason: string) => Promise<{ requestId: string; maskedEmail: string }>;
  onConfirmOtp: (requestId: string, otp: string) => Promise<void>;
};

export function AdminEmailChangeRequestModal({
  show,
  adminName,
  currentEmail,
  onClose,
  onInitiate,
  onConfirmOtp,
}: AdminEmailChangeRequestModalProps) {
  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState('');
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusPopup, setStatusPopup] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const reset = () => {
    setStep('reason');
    setReason('');
    setOtp('');
    setRequestId(null);
    setMaskedEmail('');
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!show) return null;

  const handleReasonSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError('Please enter a reason (at least 5 characters).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await onInitiate(trimmed);
      setRequestId(result.requestId);
      setMaskedEmail(result.maskedEmail);
      setStep('otp');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : null;
      setError(Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : 'Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestId) return;
    const trimmedOtp = otp.trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError('Enter the 6-digit OTP from the email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirmOtp(requestId, trimmedOtp);
      setStep('success');
      setStatusPopup({
        type: 'success',
        message: 'Email change request submitted. The school admin will review it.',
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
                  Send email change request
                </h3>
                <p className="small text-muted mb-0">
                  For <strong>{adminName}</strong> ({currentEmail})
                </p>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} />
            </div>

            {step === 'reason' ? (
              <form onSubmit={(e) => void handleReasonSubmit(e)}>
                <label className="form-label small text-secondary">Reason for email change</label>
                <textarea
                  className="form-control mb-3"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this admin needs an email change…"
                  required
                  minLength={5}
                />
                <p className="small text-muted">
                  After you submit, a verification OTP will be sent to the admin&apos;s current email.
                </p>
                {error ? <div className="alert alert-danger py-2 small">{error}</div> : null}
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                    {loading ? 'Sending…' : 'Submit & send OTP'}
                  </button>
                </div>
              </form>
            ) : step === 'otp' ? (
              <form onSubmit={(e) => void handleOtpSubmit(e)}>
                <p className="small text-muted mb-3">
                  Enter the 6-digit OTP sent to <strong>{maskedEmail || currentEmail}</strong>.
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
                      setStep('reason');
                      setOtp('');
                      setError(null);
                    }}
                  >
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                    {loading ? 'Verifying…' : 'Verify & submit request'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-2">
                <i className="bi bi-check-circle text-success" style={{ fontSize: '2.5rem' }} />
                <p className="mt-3 mb-0">Request submitted successfully.</p>
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
