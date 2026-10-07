import type { ReactNode } from 'react';
import type { ApprovedEventPublic } from '../services/public-events.service';
import { imageSrc } from '../utils/image';

export type ProfileSettingsAction = {
  key: 'categories' | 'messages' | 'liked' | 'notifications' | 'saved' | 'help';
  title: string;
  subtitle: string;
  icon: string;
  badge?: number;
};

type UserLike = {
  name?: string | null;
  email?: string | null;
  schoolName?: string | null;
};

type Props = {
  user: UserLike | null;
  profilePicUrl: string | null;
  avatarFailed: boolean;
  onAvatarError: () => void;
  onOpenAccountProfile: () => void;
  onLogout: () => void;
  onLogin: () => void;
  onSignup: () => void;
  settingsActions: ProfileSettingsAction[];
  onSettingsAction: (key: ProfileSettingsAction['key']) => void;
  showRecentNews: boolean;
  onToggleRecentNews: () => void;
  recentNewsContent: ReactNode;
  guestRecentEvents: ApprovedEventPublic[];
  onGuestRecentEventClick: (event: ApprovedEventPublic) => void;
  onDeleteAccount: () => void;
};

function legalHref(pathWithHash: string): string {
  if (typeof window === 'undefined') return pathWithHash;
  if (pathWithHash.startsWith('http')) return pathWithHash;
  const base = window.location.origin;
  if (pathWithHash.startsWith('/#')) return `${base}${pathWithHash}`;
  if (pathWithHash.startsWith('#')) return `${base}/${pathWithHash}`;
  return `${base}/${pathWithHash}`;
}

export function ProfileSubpageHeader({
  title,
  onBack,
  backLabel = 'Back',
}: {
  title: string;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <header className="student-profile-subpage-header">
      <button type="button" className="student-profile-subpage-back" onClick={onBack} aria-label={backLabel}>
        <i className="bi bi-arrow-left" aria-hidden />
      </button>
      <h1 className="student-profile-subpage-title">{title}</h1>
    </header>
  );
}

export function StudentProfileHub({
  user,
  profilePicUrl,
  avatarFailed,
  onAvatarError,
  onOpenAccountProfile,
  onLogout,
  onLogin,
  onSignup,
  settingsActions,
  onSettingsAction,
  showRecentNews,
  onToggleRecentNews,
  recentNewsContent,
  guestRecentEvents,
  onGuestRecentEventClick,
  onDeleteAccount,
}: Props) {
  const initial = (user?.name?.trim()?.charAt(0) || '?').toUpperCase();

  return (
    <div className="student-profile">
      <header className="student-profile-hero">
        <div className="student-profile-hero__glow" aria-hidden />
        <p className="student-profile-hero__eyebrow">Account</p>
        <h1 className="student-profile-hero__title">Profile</h1>
      </header>

      {!user ? (
        <>
          <div className="student-profile-card student-profile-card--guest">
            <p className="student-profile-card__lead">
              Sign in to save posts, message classmates, and personalize your school feed.
            </p>
            <div className="student-profile-auth-actions">
              <button type="button" className="student-profile-btn student-profile-btn--primary" onClick={onLogin}>
                Sign in
              </button>
              <button type="button" className="student-profile-btn student-profile-btn--secondary" onClick={onSignup}>
                <i className="bi bi-person-plus" aria-hidden />
                Create account
              </button>
            </div>
          </div>

          <p className="student-profile-section-title">Recently added</p>
          <div className="student-profile-card student-profile-menu">
            {guestRecentEvents.length === 0 ? (
              <p className="small text-muted mb-0 p-3">No news yet.</p>
            ) : (
              guestRecentEvents.map((e) => {
                const schoolLogoUrl = e.school?.image ? imageSrc(e.school.image) : '';
                return (
                  <button
                    key={e.id}
                    type="button"
                    className="student-profile-news-row px-3"
                    onClick={() => onGuestRecentEventClick(e)}
                  >
                    {schoolLogoUrl ? (
                      <img src={schoolLogoUrl} alt="" className="student-profile-news-row__thumb" />
                    ) : (
                      <span className="student-profile-news-row__thumb-fallback">
                        <i className="bi bi-building" aria-hidden />
                      </span>
                    )}
                    <span className="min-width-0 flex-grow-1">
                      <span className="d-block text-truncate fw-semibold" style={{ fontSize: '0.9rem' }}>{e.title}</span>
                      <span className="small text-muted">{e.school?.name ?? 'School'}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          <div className="student-profile-identity">
            <button type="button" className="student-profile-avatar-btn" onClick={onOpenAccountProfile} aria-label="Account options">
              <span className="student-profile-avatar">
                <span className="student-profile-avatar__inner">
                  {profilePicUrl && !avatarFailed ? (
                    <img src={profilePicUrl} alt="" onError={onAvatarError} />
                  ) : (
                    initial
                  )}
                </span>
              </span>
              <span className="student-profile-avatar__status" title="Active" aria-hidden />
            </button>
            <div className="student-profile-identity__body">
              <div className="student-profile-identity__name">{user.name ?? 'Student'}</div>
              <div className="student-profile-identity__email">{user.email}</div>
              {user.schoolName ? <div className="student-profile-identity__school">{user.schoolName}</div> : null}
            </div>
            <div className="student-profile-identity__actions">
              <button type="button" className="student-profile-icon-btn" onClick={onLogout} aria-label="Log out">
                <i className="bi bi-box-arrow-right" aria-hidden />
              </button>
              <button
                type="button"
                className="student-profile-icon-btn student-profile-icon-btn--accent"
                onClick={onOpenAccountProfile}
                aria-label="Account settings"
              >
                <i className="bi bi-gear" aria-hidden />
              </button>
            </div>
          </div>

          <div className="student-profile-quick">
            <button type="button" className="student-profile-quick__btn" onClick={onOpenAccountProfile}>
              <i className="bi bi-person" aria-hidden />
              Account
            </button>
            <button type="button" className="student-profile-quick__btn" onClick={() => onSettingsAction('saved')}>
              <i className="bi bi-bookmark" aria-hidden />
              Saved
            </button>
            <button type="button" className="student-profile-quick__btn" onClick={() => onSettingsAction('notifications')}>
              <i className="bi bi-bell" aria-hidden />
              Alerts
            </button>
          </div>

          <p className="student-profile-section-title">Shortcuts</p>
          <div className="student-profile-card student-profile-menu">
            {settingsActions.map((item) => (
              <button
                key={item.key}
                type="button"
                className="student-profile-menu__item"
                onClick={() => onSettingsAction(item.key)}
              >
                <span className="student-profile-menu__icon-wrap">
                  <i className={`bi ${item.icon}`} aria-hidden />
                  {item.badge != null && item.badge > 0 ? (
                    <span className="student-profile-menu__badge">{item.badge > 99 ? '99+' : item.badge}</span>
                  ) : null}
                </span>
                <span className="student-profile-menu__text">
                  <span className="student-profile-menu__title">{item.title}</span>
                  <span className="student-profile-menu__subtitle">{item.subtitle}</span>
                </span>
                <i className="bi bi-chevron-right student-profile-menu__chevron" aria-hidden />
              </button>
            ))}
          </div>

          <p className="student-profile-section-title">Discover</p>
          <div className="student-profile-card student-profile-recent">
            <button type="button" className="student-profile-menu__item" onClick={onToggleRecentNews}>
              <span className="student-profile-menu__icon-wrap">
                <i className="bi bi-newspaper" aria-hidden />
              </span>
              <span className="student-profile-menu__text">
                <span className="student-profile-menu__title">Recently added schools / news</span>
                <span className="student-profile-menu__subtitle">Latest posts across SemBuzz</span>
              </span>
              <i className={`bi bi-chevron-${showRecentNews ? 'up' : 'down'} student-profile-menu__chevron`} aria-hidden />
            </button>
            {showRecentNews ? <div className="student-profile-recent__panel">{recentNewsContent}</div> : null}
          </div>
        </>
      )}

      <footer className="student-profile-footer">
        <div className="student-profile-footer__links">
          <a className="student-profile-footer__link" href={legalHref('/privacy')} target="_blank" rel="noopener noreferrer">
            Privacy
          </a>
          <a className="student-profile-footer__link" href={legalHref('/terms')} target="_blank" rel="noopener noreferrer">
            Terms
          </a>
          <a
            className="student-profile-footer__link"
            href={legalHref('/#community-guidelines')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Community
          </a>
        </div>
        {user ? (
          <button type="button" className="student-profile-footer__danger" onClick={onDeleteAccount}>
            Delete account
          </button>
        ) : null}
      </footer>
    </div>
  );
}
