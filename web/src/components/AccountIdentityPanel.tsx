import { type FormEvent, useEffect, useState } from 'react';

type AccountIdentityPanelProps = {
  userId?: string | null;
  email: string;
  onUpdateEmail: (email: string) => Promise<void>;
  className?: string;
};

export function AccountIdentityPanel({
  userId,
  email,
  onUpdateEmail,
  className = '',
}: AccountIdentityPanelProps) {
  const [editing, setEditing] = useState(false);
  const [nextEmail, setNextEmail] = useState(email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setNextEmail(email);
    }
  }, [email, editing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nextEmail.trim();
    if (!trimmed) {
      setError('Email is required.');
      return;
    }
    if (trimmed.toLowerCase() === email.toLowerCase()) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await onUpdateEmail(trimmed);
      setSuccess('Email updated. Use your new email the next time you sign in.');
      setEditing(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : null;
      setError(Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : 'Failed to update email.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`card border-0 shadow-sm ${className}`.trim()} style={{ borderRadius: 0 }}>
      <div className="card-body p-4">
        <h2 className="h5 mb-3" style={{ color: '#1a1f2e', fontWeight: 500 }}>
          Account identity
        </h2>
        <p className="small text-muted mb-3">
          Your User ID is permanent. Email is used for sign-in and notifications and can be updated without
          changing your roles or access.
        </p>

        <div className="mb-3">
          <label className="form-label small text-secondary mb-1">User ID</label>
          <div
            className="form-control bg-light font-monospace small text-break"
            style={{ wordBreak: 'break-all' }}
          >
            {userId || '—'}
          </div>
        </div>

        {!editing ? (
          <>
            <div className="mb-3">
              <label className="form-label small text-secondary mb-1">Email</label>
              <div className="form-control bg-light">{email}</div>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => {
                setNextEmail(email);
                setError(null);
                setSuccess(null);
                setEditing(true);
              }}
            >
              Change email
            </button>
          </>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="mb-3">
              <label className="form-label small text-secondary mb-1">New email</label>
              <input
                type="email"
                className="form-control"
                value={nextEmail}
                onChange={(e) => setNextEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save email'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setNextEmail(email);
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {error ? <div className="alert alert-danger mt-3 mb-0 py-2 small">{error}</div> : null}
        {success ? <div className="alert alert-success mt-3 mb-0 py-2 small">{success}</div> : null}
      </div>
    </div>
  );
}
