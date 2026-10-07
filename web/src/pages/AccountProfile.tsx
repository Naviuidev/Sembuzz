import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventsStudentShell } from '../components/EventsStudentShell';
import { ProfileSubpageHeader } from '../components/StudentProfileHub';
import { useUserAuth } from '../contexts/UserAuthContext';
import { userAuthService } from '../services/user-auth.service';

function legalHref(pathWithHash: string): string {
  if (typeof window === 'undefined') return pathWithHash;
  if (pathWithHash.startsWith('http')) return pathWithHash;
  const base = window.location.origin;
  if (pathWithHash.startsWith('/#')) return `${base}${pathWithHash}`;
  if (pathWithHash.startsWith('#')) return `${base}/${pathWithHash}`;
  return `${base}/${pathWithHash}`;
}

type OptionRowProps = {
  icon: string;
  label: string;
  hint?: string;
  onClick: () => void;
  destructive?: boolean;
};

function OptionRow({ icon, label, hint, onClick, destructive }: OptionRowProps) {
  return (
    <button type="button" className="student-profile-menu__item" onClick={onClick}>
      <span
        className="student-profile-menu__icon-wrap"
        style={destructive ? { background: '#fef2f2', color: '#dc2626' } : undefined}
      >
        <i className={`bi ${icon}`} aria-hidden />
      </span>
      <span className="student-profile-menu__text">
        <span className="student-profile-menu__title" style={destructive ? { color: '#dc2626' } : undefined}>{label}</span>
        {hint ? <span className="student-profile-menu__subtitle">{hint}</span> : null}
      </span>
      <i className="bi bi-chevron-right student-profile-menu__chevron" aria-hidden />
    </button>
  );
}

export const AccountProfile = () => {
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    const password = deletePassword.trim();
    if (!password) {
      setDeleteError('Enter your password to continue.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await userAuthService.deleteAccount(password);
      setShowDeleteModal(false);
      logout();
      navigate('/events', { replace: true });
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setDeleteError(typeof msg === 'string' ? msg : 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) {
    navigate('/events', { replace: true, state: { openAuth: 'login' } });
    return null;
  }

  return (
    <EventsStudentShell activeTab="settings" contentClassName="events-student-shell-page">
      <div className="student-profile">
        <ProfileSubpageHeader
          title="Account"
          backLabel="Back to profile"
          onBack={() => navigate('/events', { state: { bottomNav: 'settings' } })}
        />

        <p className="student-profile-section-title">Profile</p>
        <div className="student-profile-card student-profile-menu mb-4">
          <OptionRow icon="bi-pencil-square" label="Edit profile" hint="Name, photo, password" onClick={() => navigate('/profile/edit')} />
          <OptionRow icon="bi-person" label="View profile" hint="Your public details" onClick={() => navigate('/profile/view')} />
        </div>

        <p className="student-profile-section-title">Legal</p>
        <div className="student-profile-card student-profile-menu mb-4">
          <OptionRow
            icon="bi-shield-check"
            label="Privacy policy"
            onClick={() => window.open(legalHref('/privacy'), '_blank', 'noopener,noreferrer')}
          />
          <OptionRow
            icon="bi-file-text"
            label="Terms and conditions"
            onClick={() => window.open(legalHref('/terms'), '_blank', 'noopener,noreferrer')}
          />
          <OptionRow
            icon="bi-people"
            label="Community guidelines"
            onClick={() => window.open(legalHref('/#community-guidelines'), '_blank', 'noopener,noreferrer')}
          />
        </div>

        <p className="student-profile-section-title">Danger zone</p>
        <div className="student-profile-card student-profile-menu">
          <OptionRow
            icon="bi-trash"
            label="Delete account"
            hint="Permanent — cannot be undone"
            destructive
            onClick={() => {
              setDeletePassword('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
          />
        </div>
      </div>

      {showDeleteModal ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(15,23,42,0.45)', zIndex: 1050 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
        >
          <div
            className="student-profile-form-card w-100"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-account-title" className="h5 fw-bold mb-2">
              Delete account
            </h3>
            <p className="small text-secondary mb-3">This action is permanent. Enter your password to continue.</p>
            <input
              type="password"
              className="form-control mb-2"
              placeholder="Password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError(null);
              }}
            />
            {deleteError ? <p className="small text-danger mb-2">{deleteError}</p> : null}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="student-profile-btn student-profile-btn--secondary"
                disabled={deleteLoading}
                onClick={() => !deleteLoading && setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="student-profile-btn student-profile-btn--primary"
                style={{ background: '#dc2626' }}
                disabled={!deletePassword.trim() || deleteLoading}
                onClick={() => void handleDeleteAccount()}
              >
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </EventsStudentShell>
  );
};
