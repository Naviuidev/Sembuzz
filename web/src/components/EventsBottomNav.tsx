import { useEffect, useState, type ReactNode } from 'react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { imageSrc } from '../utils/image';

/** Matches mobile bottom tabs: Search, Home, Settings, Apps, Chat. */
export type EventsBottomNavTab = 'search' | 'home' | 'settings' | 'apps' | 'chat';

type EventsBottomNavProps = {
  activeTab: EventsBottomNavTab;
  onSelectTab: (tab: EventsBottomNavTab) => void;
  notifUnreadCount: number;
  chatUnreadCount?: number;
  visible?: boolean;
  zIndex?: number;
  /** When true, shows a fixed left sidebar on large screens and bottom bar on small screens. */
  responsiveLayout?: boolean;
};

const TAB_META: { tab: EventsBottomNavTab; label: string; icon: string; iconActive: string }[] = [
  { tab: 'home', label: 'Home', icon: 'bi-house-door', iconActive: 'bi-house-door-fill' },
  { tab: 'search', label: 'Search', icon: 'bi-search', iconActive: 'bi-search' },
  { tab: 'settings', label: 'Profile', icon: 'bi-person', iconActive: 'bi-person-fill' },
  { tab: 'apps', label: 'Apps', icon: 'bi-grid-3x3-gap', iconActive: 'bi-grid-3x3-gap-fill' },
  { tab: 'chat', label: 'Messages', icon: 'bi-chat-dots', iconActive: 'bi-chat-dots-fill' },
];

export function EventsBottomNav({
  activeTab,
  onSelectTab,
  notifUnreadCount,
  chatUnreadCount = 0,
  visible = true,
  zIndex = 1030,
  responsiveLayout = false,
}: EventsBottomNavProps) {
  const { user } = useUserAuth();
  const profileImageValue =
    (user as { profilePicUrl?: string | null; image?: string | null } | null)?.profilePicUrl ||
    (user as { profilePicUrl?: string | null; image?: string | null } | null)?.image ||
    '';
  const [settingsSchoolImgFailed, setSettingsSchoolImgFailed] = useState(false);
  const [settingsProfileImgFailed, setSettingsProfileImgFailed] = useState(false);

  useEffect(() => {
    setSettingsSchoolImgFailed(false);
    setSettingsProfileImgFailed(false);
  }, [user?.id, user?.schoolImage, profileImageValue]);

  const isActive = (tab: EventsBottomNavTab) => activeTab === tab;

  const renderProfileIcon = (size: number) => {
    if (profileImageValue && !settingsProfileImgFailed) {
      return (
        <img
          src={imageSrc(profileImageValue)}
          alt=""
          className="events-nav-profile-img"
          style={{ width: size, height: size }}
          onError={() => setSettingsProfileImgFailed(true)}
        />
      );
    }
    if (user?.schoolImage && !settingsSchoolImgFailed) {
      return (
        <img
          src={imageSrc(user.schoolImage)}
          alt=""
          className="events-nav-profile-img"
          style={{ width: size, height: size }}
          onError={() => setSettingsSchoolImgFailed(true)}
        />
      );
    }
    if (user) {
      return (
        <span
          className="events-nav-profile-fallback"
          style={{ width: size, height: size, fontSize: size * 0.42 }}
        >
          {(user.schoolName?.trim()?.charAt(0) || user.name?.trim()?.charAt(0) || '?').slice(0, 1)}
        </span>
      );
    }
    return (
      <i
        className={`bi ${isActive('settings') ? 'bi-person-fill' : 'bi-person'}`}
        aria-hidden
      />
    );
  };

  const renderBadge = (count: number) =>
    count > 0 ? (
      <span className="events-nav-badge">
        {count > 99 ? '99+' : count}
      </span>
    ) : null;

  const profileControl = (size: number, showNotifBadge: boolean) => (
    <span
      className={`events-nav-profile-wrap position-relative d-inline-flex align-items-center justify-content-center${
        isActive('settings') ? ' is-active' : ''
      }`}
    >
      {renderProfileIcon(size)}
      {showNotifBadge && user && notifUnreadCount > 0 ? renderBadge(notifUnreadCount) : null}
    </span>
  );

  const renderSidebarItem = (tab: EventsBottomNavTab, label: string, icon: string, iconActive: string) => {
    const active = isActive(tab);
    return (
      <button
        key={tab}
        type="button"
        className={`events-sidebar-nav-item${active ? ' is-active' : ''}`}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        onClick={() => onSelectTab(tab)}
      >
        <span className="events-sidebar-nav-icon">
          {tab === 'settings' ? (
            profileControl(24, true)
          ) : tab === 'chat' ? (
            <span className="position-relative d-inline-flex">
              <i className={`bi ${active ? iconActive : icon}`} aria-hidden />
              {renderBadge(chatUnreadCount)}
            </span>
          ) : (
            <i className={`bi ${active ? iconActive : icon}`} aria-hidden />
          )}
        </span>
        <span className="events-sidebar-nav-label">{label}</span>
      </button>
    );
  };

  const renderBottomIconButton = (tab: EventsBottomNavTab, ariaLabel: string, children: ReactNode) => (
    <button
      type="button"
      className={`events-bottom-nav-btn${isActive(tab) ? ' is-active' : ''}`}
      aria-label={ariaLabel}
      aria-current={isActive(tab) ? 'page' : undefined}
      onClick={() => onSelectTab(tab)}
    >
      {children}
    </button>
  );

  return (
    <>
      {responsiveLayout ? (
        <aside className="events-sidebar-nav" aria-label="Primary">
          <div className="events-sidebar-nav-inner">
            <nav className="events-sidebar-nav-list">
              {TAB_META.map(({ tab, label, icon, iconActive }) =>
                renderSidebarItem(tab, label, icon, iconActive),
              )}
            </nav>
          </div>
        </aside>
      ) : null}

      <div
        className={`events-bottom-nav-host${responsiveLayout ? ' events-bottom-nav-host--responsive' : ''}`}
        style={{
          zIndex,
          transform: visible ? 'translateY(0)' : 'translateY(110%)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div className="events-bottom-nav-shell">
          <div className="d-flex justify-content-between align-items-center events-bottom-nav-row">
            {renderBottomIconButton(
              'home',
              'Home',
              <i className={`bi ${isActive('home') ? 'bi-house-door-fill' : 'bi-house-door'}`} aria-hidden />,
            )}
            {renderBottomIconButton(
              'search',
              'Search',
              <i className="bi bi-search" aria-hidden />,
            )}
            {renderBottomIconButton('settings', 'Profile', profileControl(26, true))}
            {renderBottomIconButton(
              'apps',
              'Apps',
              <i
                className={`bi ${isActive('apps') ? 'bi-grid-3x3-gap-fill' : 'bi-grid-3x3-gap'}`}
                aria-hidden
              />,
            )}
            {renderBottomIconButton(
              'chat',
              'Messages',
              <span className="position-relative d-inline-flex">
                <i
                  className={`bi ${isActive('chat') ? 'bi-chat-dots-fill' : 'bi-chat-dots'}`}
                  aria-hidden
                />
                {renderBadge(chatUnreadCount)}
              </span>,
            )}
          </div>
        </div>
      </div>
    </>
  );
}
