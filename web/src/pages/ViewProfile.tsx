import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SchoolNavbar } from '../components/SchoolNavbar';
import { useUserAuth } from '../contexts/UserAuthContext';
import { imageSrc } from '../utils/image';

export const ViewProfile = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();

  const avatarUrl = useMemo(() => (user?.profilePicUrl ? imageSrc(user.profilePicUrl) : ''), [user?.profilePicUrl]);

  const firstName = user?.firstName?.trim() || user?.name?.split(' ')[0] || '—';
  const lastName =
    user?.lastName?.trim() || (user?.name?.split(' ').length ? user.name.split(' ').slice(1).join(' ') : '') || '—';

  if (!user) {
    navigate('/events', { replace: true, state: { openAuth: 'login' } });
    return null;
  }

  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: '2rem' }}>
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
            View profile
          </h1>
        </div>

        <div className="d-flex justify-content-center py-4 mb-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 170, height: 170, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: 170,
                height: 170,
                borderRadius: '50%',
                backgroundColor: '#eef1f4',
              }}
            >
              <i className="bi bi-person" style={{ fontSize: '3rem', color: '#7d8590' }} />
            </div>
          )}
        </div>

        <div className="rounded-3 border p-3" style={{ borderColor: '#edf0f2' }}>
          <div className="small fw-bold text-secondary mb-2" style={{ letterSpacing: '0.05em' }}>
            PROFILE DETAILS
          </div>
          <div className="py-2 border-bottom" style={{ borderColor: '#e7ebef' }}>
            <div className="small text-secondary">First name</div>
            <div className="fw-semibold" style={{ color: '#1a1f2e' }}>
              {firstName}
            </div>
          </div>
          <div className="py-2 border-bottom" style={{ borderColor: '#e7ebef' }}>
            <div className="small text-secondary">Last name</div>
            <div className="fw-semibold" style={{ color: '#1a1f2e' }}>
              {lastName}
            </div>
          </div>
          <div className="py-2 border-bottom" style={{ borderColor: '#e7ebef' }}>
            <div className="small text-secondary">Email</div>
            <div className="fw-semibold" style={{ color: '#1a1f2e' }}>
              {user.email}
            </div>
          </div>
          <div className="py-2">
            <div className="small text-secondary">School</div>
            <div className="fw-semibold" style={{ color: '#1a1f2e' }}>
              {user.schoolName || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
