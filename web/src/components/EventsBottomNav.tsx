import { useEffect, useState } from 'react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { imageSrc } from '../utils/image';

/** Matches mobile `AppNavigator` bottom tabs: Search, Home, Settings (school logo → profile → initial), Apps, Blogs. */
export type EventsBottomNavTab = 'search' | 'home' | 'settings' | 'apps' | 'blogs';

type EventsBottomNavProps = {
  activeTab: EventsBottomNavTab;
  onSelectTab: (tab: EventsBottomNavTab) => void;
  notifUnreadCount: number;
  visible?: boolean;
  zIndex?: number;
};

export function EventsBottomNav({
  activeTab,
  onSelectTab,
  notifUnreadCount,
  visible = true,
  zIndex = 1030,
}: EventsBottomNavProps) {
  const { user } = useUserAuth();
  const [settingsSchoolImgFailed, setSettingsSchoolImgFailed] = useState(false);
  const [settingsProfileImgFailed, setSettingsProfileImgFailed] = useState(false);

  useEffect(() => {
    setSettingsSchoolImgFailed(false);
    setSettingsProfileImgFailed(false);
  }, [user?.id, user?.schoolImage, user?.profilePicUrl]);

  const iconColor = (tab: EventsBottomNavTab) => (activeTab === tab ? '#1a1f2e' : '#6c757d');

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex,
          display: 'flex',
          justifyContent: 'center',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
          transform: visible ? 'translateY(0)' : 'translateY(120%)',
          opacity: visible ? 1 : 0,
          transition: 'transform 260ms ease, opacity 260ms ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div
          className="events-bottom-nav-shell"
          style={{
            width: '100%',
            maxWidth: '600px',
            background: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
            padding: '10px 8px',
          }}
        >
          <div className="d-flex justify-content-between align-items-center" style={{ gap: 4 }}>
            <button
              type="button"
              className={`events-bottom-nav-btn ${activeTab === 'search' ? 'events-bottom-nav-btn-active' : ''}`}
              aria-label="Search"
              aria-current={activeTab === 'search' ? 'page' : undefined}
              onClick={() => onSelectTab('search')}
            >
              <i className="bi bi-search" style={{ fontSize: '1.375rem', color: iconColor('search') }} />
            </button>
            <button
              type="button"
              className={`events-bottom-nav-btn ${activeTab === 'home' ? 'events-bottom-nav-btn-active' : ''}`}
              aria-label="Home"
              aria-current={activeTab === 'home' ? 'page' : undefined}
              onClick={() => onSelectTab('home')}
            >
              <i className="bi bi-house-door" style={{ fontSize: '1.375rem', color: iconColor('home') }} />
            </button>
            <button
              type="button"
              className={`events-bottom-nav-btn ${activeTab === 'settings' ? 'events-bottom-nav-btn-active' : ''}`}
              aria-label="Account"
              aria-current={activeTab === 'settings' ? 'page' : undefined}
              onClick={() => onSelectTab('settings')}
            >
              <span className="position-relative d-inline-flex align-items-center justify-content-center">
                {user?.schoolImage && !settingsSchoolImgFailed ? (
                  <img
                    src={imageSrc(user.schoolImage)}
                    alt=""
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                    onError={() => setSettingsSchoolImgFailed(true)}
                  />
                ) : user?.profilePicUrl && !settingsProfileImgFailed ? (
                  <img
                    src={imageSrc(user.profilePicUrl)}
                    alt=""
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                    onError={() => setSettingsProfileImgFailed(true)}
                  />
                ) : user ? (
                  <span
                    className="d-inline-flex align-items-center justify-content-center fw-bold text-uppercase"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#eef1f6',
                      fontSize: '0.7rem',
                      color: '#1a1f2e',
                    }}
                  >
                    {(user.schoolName?.trim()?.charAt(0) || user.name?.trim()?.charAt(0) || '?').slice(0, 1)}
                  </span>
                ) : (
                  <i className="bi bi-person" style={{ fontSize: '1.25rem', color: iconColor('settings') }} />
                )}
                {user && notifUnreadCount > 0 ? (
                  <span
                    className="position-absolute rounded-pill bg-danger text-white"
                    style={{
                      top: -6,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      fontSize: 9,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      lineHeight: 1,
                      border: '1.5px solid #fff',
                    }}
                  >
                    {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                  </span>
                ) : null}
              </span>
            </button>
            <button
              type="button"
              className={`events-bottom-nav-btn ${activeTab === 'apps' ? 'events-bottom-nav-btn-active' : ''}`}
              aria-label="Apps"
              aria-current={activeTab === 'apps' ? 'page' : undefined}
              onClick={() => onSelectTab('apps')}
            >
              <i className="bi bi-grid-3x3-gap" style={{ fontSize: '1.375rem', color: iconColor('apps') }} />
            </button>
            <button
              type="button"
              className={`events-bottom-nav-btn ${activeTab === 'blogs' ? 'events-bottom-nav-btn-active' : ''}`}
              aria-label="Blogs"
              aria-current={activeTab === 'blogs' ? 'page' : undefined}
              onClick={() => onSelectTab('blogs')}
            >
              <i className="bi bi-newspaper" style={{ fontSize: '1.375rem', color: iconColor('blogs') }} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .events-bottom-nav-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 10px;
          margin: 0 4px;
          border: none;
          border-radius: 14px;
          background: transparent;
          cursor: pointer;
          transition: background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .events-bottom-nav-btn:hover {
          background: rgba(26, 31, 46, 0.04);
        }
        .events-bottom-nav-btn-active {
          background: #f3f6ff !important;
          border: 1px solid #dbe4ff !important;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
        }
        .events-bottom-nav-btn-active:hover {
          background: #f3f6ff !important;
        }
      `}</style>
    </>
  );
}
