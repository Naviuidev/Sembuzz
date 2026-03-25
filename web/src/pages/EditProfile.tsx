import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SchoolNavbar } from '../components/SchoolNavbar';
import { useUserAuth } from '../contexts/UserAuthContext';
import { userAuthService } from '../services/user-auth.service';
import { imageSrc } from '../utils/image';

export const EditProfile = () => {
  const { user, logout, refreshUser } = useUserAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(
    () => user?.firstName?.trim() || user?.name?.split(' ').slice(0, 1).join(' ') || '',
  );
  const [lastName, setLastName] = useState(
    () => user?.lastName?.trim() || user?.name?.split(' ').slice(1).join(' ') || '',
  );
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profilePicUrl || '');
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resolvedImageUrl = useMemo(() => (profilePicUrl ? imageSrc(profilePicUrl) : ''), [profilePicUrl]);

  if (!user) {
    navigate('/events', { replace: true, state: { openAuth: 'login' } });
    return null;
  }

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await userAuthService.uploadProfilePic(file);
      if (res?.url) setProfilePicUrl(res.url);
    } catch {
      setError('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    if (changePassword) {
      if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
        setError('Fill current password, new password and confirm password.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match.');
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: Parameters<typeof userAuthService.updateProfile>[0] = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profilePicUrl: profilePicUrl.trim(),
      };
      if (changePassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
        payload.confirmPassword = confirmPassword;
      }

      await userAuthService.updateProfile(payload);

      if (changePassword) {
        logout();
        navigate('/events', { replace: true, state: { openAuth: 'login' } });
        return;
      }

      await refreshUser();
      setSuccess('Your profile details were saved successfully.');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa', paddingBottom: '2rem' }}>
      <SchoolNavbar />
      <div className="container py-4" style={{ maxWidth: 640 }}>
        <div className="d-flex align-items-center gap-2 mb-4">
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none d-flex align-items-center"
            onClick={() => navigate('/profile')}
            aria-label="Back to Profile"
          >
            <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
          </button>
          <h1 className="mb-0" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1f2e' }}>
            Edit profile
          </h1>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="d-flex flex-column align-items-center mb-4">
            <div
              className="rounded-circle border d-flex align-items-center justify-content-center overflow-hidden mb-2"
              style={{
                width: 88,
                height: 88,
                borderWidth: 3,
                borderColor: '#0b4a99',
                backgroundColor: '#e9ecef',
              }}
            >
              {resolvedImageUrl ? (
                <img src={resolvedImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="fw-bold text-secondary" style={{ fontSize: '1.5rem' }}>
                  {(firstName || user.name || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <label className="btn btn-sm btn-outline-secondary rounded-pill mb-0">
              {uploading ? 'Uploading…' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                className="d-none"
                disabled={uploading}
                onChange={(ev) => void handleUpload(ev.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="mb-3">
            <label className="form-label small text-secondary">First name</label>
            <input
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="mb-3">
            <label className="form-label small text-secondary">Last name</label>
            <input
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
          <div className="mb-3">
            <label className="form-label small text-secondary">Email</label>
            <input className="form-control bg-light" value={user.email} readOnly disabled />
            <span className="small text-muted">Email cannot be changed here.</span>
          </div>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="changePw"
              checked={changePassword}
              onChange={(e) => setChangePassword(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="changePw">
              Change password
            </label>
          </div>

          {changePassword ? (
            <>
              <div className="mb-3">
                <label className="form-label small text-secondary">Current password</label>
                <input
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-secondary">New password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small text-secondary">Confirm new password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </>
          ) : null}

          {error ? <div className="alert alert-danger py-2 small mb-3">{error}</div> : null}
          {success ? <div className="alert alert-success py-2 small mb-3">{success}</div> : null}

          <button type="submit" className="btn btn-dark w-100 rounded-3 py-2 fw-semibold" disabled={saving || uploading}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
