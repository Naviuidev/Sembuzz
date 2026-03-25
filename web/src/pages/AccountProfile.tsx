import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SchoolNavbar } from '../components/SchoolNavbar';
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
  onClick: () => void;
  destructive?: boolean;
};

function OptionRow({ icon, label, onClick, destructive }: OptionRowProps) {
  return (
    <button
      type="button"
      className="w-100 border-0 text-start d-flex align-items-center justify-content-between rounded-3 mb-2 px-3 py-3"
      style={{
        backgroundColor: destructive ? '#fff7f8' : '#fff',
        border: destructive ? '1px solid #f7d7db' : '1px solid #eceef2',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <span className="d-flex align-items-center gap-2">
        <i className={`bi ${icon}`} style={{ fontSize: '1.15rem', color: destructive ? '#dc3545' : '#1a1f2e' }} />
        <span style={{ fontSize: '0.95rem', fontWeight: destructive ? 600 : 500, color: destructive ? '#dc3545' : '#1a1f2e' }}>
          {label}
        </span>
      </span>
      <i className="bi bi-chevron-right" style={{ fontSize: '1rem', color: destructive ? '#dc3545' : '#6c757d' }} />
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

  const goSettingsHub = () => {
    navigate('/events', { state: { bottomNav: 'settings' } });
  };

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
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa', paddingBottom: '2rem' }}>
      <SchoolNavbar />
      <div className="container py-3" style={{ maxWidth: 640 }}>
        <div className="d-flex align-items-center mb-4">
          <div style={{ width: 44 }} className="d-flex justify-content-start flex-shrink-0">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={goSettingsHub}
              aria-label="Back"
            >
              <i className="bi bi-chevron-left" style={{ fontSize: '1.35rem', color: '#1a1f2e' }} />
            </button>
          </div>
          <h1 className="flex-grow-1 text-center mb-0" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1f2e' }}>
            Profile
          </h1>
          <div style={{ width: 44 }} className="d-flex justify-content-end flex-shrink-0">
            <button
              type="button"
              className="border-0 d-flex align-items-center justify-content-center"
              onClick={goSettingsHub}
              aria-label="Settings"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#0b4a99',
                color: '#fff',
                boxShadow: '0 2px 10px rgba(11, 74, 153, 0.35)',
              }}
            >
              <i className="bi bi-gear" style={{ fontSize: '1.1rem' }} />
            </button>
          </div>
        </div>

        <h2 className="mb-1" style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1a1f2e' }}>
          Account options
        </h2>
        <p className="small text-secondary mb-3" style={{ lineHeight: 1.4 }}>
          Manage your profile, legal pages, and account actions.
        </p>

        <OptionRow icon="bi-pencil-square" label="Edit profile" onClick={() => navigate('/profile/edit')} />
        <OptionRow icon="bi-person" label="View profile" onClick={() => navigate('/profile/view')} />
        <OptionRow
          icon="bi-shield-check"
          label="Privacy policy"
          onClick={() => {
            window.open(legalHref('/#privacy'), '_blank', 'noopener,noreferrer');
          }}
        />
        <OptionRow
          icon="bi-file-text"
          label="Terms and conditions"
          onClick={() => {
            window.open(legalHref('/#terms-of-service'), '_blank', 'noopener,noreferrer');
          }}
        />
        <OptionRow
          icon="bi-people"
          label="Community guideline"
          onClick={() => {
            window.open(legalHref('/#community-guidelines'), '_blank', 'noopener,noreferrer');
          }}
        />
        <OptionRow
          icon="bi-trash"
          label="Delete account"
          destructive
          onClick={() => {
            setDeletePassword('');
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
        />
      </div>

      {showDeleteModal ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.38)', zIndex: 1050 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-3 p-3 w-100"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-account-title" className="h5 fw-bold mb-2" style={{ color: '#1a1f2e' }}>
              Delete account
            </h3>
            <p className="small text-secondary mb-2">This action is permanent. Enter your password to continue.</p>
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
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={deleteLoading}
                onClick={() => !deleteLoading && setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={!deletePassword.trim() || deleteLoading}
                onClick={() => void handleDeleteAccount()}
              >
                {deleteLoading ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
