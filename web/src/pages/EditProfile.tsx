import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventsStudentShell } from '../components/EventsStudentShell';
import { ProfileSubpageHeader } from '../components/StudentProfileHub';
import { AccountIdentityPanel } from '../components/AccountIdentityPanel';
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
    <EventsStudentShell activeTab="settings" contentClassName="events-student-shell-page">
      <div className="student-profile">
        <ProfileSubpageHeader title="Edit profile" onBack={() => navigate('/profile')} />

        <form className="student-profile-form-card" onSubmit={(e) => void handleSubmit(e)}>
          <div className="d-flex flex-column align-items-center mb-4">
            <div className="student-profile-view-avatar" style={{ width: 96, height: 96 }}>
              <div className="student-profile-view-avatar__inner">
                {resolvedImageUrl ? (
                  <img src={resolvedImageUrl} alt="" />
                ) : (
                  <span className="fw-bold text-secondary" style={{ fontSize: '1.5rem' }}>
                    {(firstName || user.name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <label className="student-profile-btn student-profile-btn--secondary mt-2 mb-0">
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

          <AccountIdentityPanel
            userId={user.userId}
            email={user.email}
            className="mb-4"
            onUpdateEmail={async (email) => {
              await userAuthService.updateEmail(email);
              await refreshUser();
            }}
          />

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

          <button type="submit" className="student-profile-save-btn" disabled={saving || uploading}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </EventsStudentShell>
  );
};
