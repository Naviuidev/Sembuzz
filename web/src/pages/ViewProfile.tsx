import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventsStudentShell } from '../components/EventsStudentShell';
import { ProfileSubpageHeader } from '../components/StudentProfileHub';
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
    <EventsStudentShell activeTab="settings" contentClassName="events-student-shell-page">
      <div className="student-profile">
        <ProfileSubpageHeader title="View profile" onBack={() => navigate('/profile')} />

        <div className="d-flex justify-content-center mb-2">
          <div className="student-profile-view-avatar">
            <div className="student-profile-view-avatar__inner">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" />
              ) : (
                <i className="bi bi-person" style={{ fontSize: '2.5rem', color: '#94a3b8' }} aria-hidden />
              )}
            </div>
          </div>
        </div>

        <div className="student-profile-details">
          <div className="student-profile-details__row">
            <div className="student-profile-details__label">First name</div>
            <div className="student-profile-details__value">{firstName}</div>
          </div>
          <div className="student-profile-details__row">
            <div className="student-profile-details__label">Last name</div>
            <div className="student-profile-details__value">{lastName}</div>
          </div>
          <div className="student-profile-details__row">
            <div className="student-profile-details__label">User ID</div>
            <div className="student-profile-details__value font-monospace small">{user.userId || '—'}</div>
          </div>
          <div className="student-profile-details__row">
            <div className="student-profile-details__label">Email</div>
            <div className="student-profile-details__value">{user.email}</div>
          </div>
          <div className="student-profile-details__row">
            <div className="student-profile-details__label">School</div>
            <div className="student-profile-details__value">{user.schoolName || '—'}</div>
          </div>
        </div>
      </div>
    </EventsStudentShell>
  );
};
