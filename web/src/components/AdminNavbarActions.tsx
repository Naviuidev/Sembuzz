import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AdminActionNotificationsBell,
  type AdminActionItemsRole,
} from './AdminActionNotificationsBell';

export type AdminNavbarTone = 'pill-dark' | 'light';

const logoutBtnStyle = {
  backgroundColor: 'white',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '50px',
  padding: '0.5rem 1.5rem',
  color: '#1a1f2e',
  fontWeight: '500' as const,
  transition: 'all 0.3s',
};

export function AdminNavbarActions({
  role,
  onLogout,
  logoutLabel = 'Logout',
  compactLogout = false,
  tone = 'light',
  showNotifications = true,
}: {
  role: AdminActionItemsRole;
  onLogout: () => void;
  logoutLabel?: string;
  compactLogout?: boolean;
  tone?: AdminNavbarTone;
  /** Hide bell when portal has no action-items API (e.g. external admin). */
  showNotifications?: boolean;
}) {
  return (
    <div className={`d-flex align-items-center${tone === 'light' ? ' admin-navbar-actions' : ''}`}>
      {showNotifications ? (
        <AdminActionNotificationsBell role={role} tone={tone === 'light' ? 'light' : 'dark'} />
      ) : null}
      <LogoutButton
        onClick={onLogout}
        label={logoutLabel}
        compact={compactLogout}
        tone={tone}
      />
    </div>
  );
}

function LogoutButton({
  onClick,
  label,
  compact,
  tone,
}: {
  onClick: () => void;
  label: string;
  compact?: boolean;
  tone: AdminNavbarTone;
}) {
  if (tone === 'light') {
    return (
      <button type="button" onClick={onClick} className="admin-nav-logout">
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn"
      style={{
        ...logoutBtnStyle,
        ...(compact ? { padding: '0.4rem 1rem', border: 'none' } : {}),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#1a1f2e';
        e.currentTarget.style.color = 'white';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'white';
        e.currentTarget.style.color = '#1a1f2e';
        e.currentTarget.style.borderColor = compact ? 'transparent' : 'rgb(255, 255, 255)';
      }}
    >
      {label}
    </button>
  );
}

export function AdminNavbarShell({
  homePath,
  brandExtra,
  children,
  tone = 'light',
  portalLabel,
  accentColor = '#3468f9',
}: {
  homePath: string;
  brandExtra?: ReactNode;
  children: ReactNode;
  tone?: AdminNavbarTone;
  portalLabel?: string;
  accentColor?: string;
}) {
  if (tone === 'light') {
    return (
      <nav
        className="admin-navbar admin-navbar--light"
        style={{ '--admin-accent': accentColor } as CSSProperties}
      >
        <div className="admin-navbar-inner">
          <Link className="admin-navbar-brand" to={homePath}>
            <span className="admin-navbar-brand-text">SemBuzz</span>
            {portalLabel ? <span className="admin-navbar-portal-badge">{portalLabel}</span> : null}
            {brandExtra}
          </Link>
          {children}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="navbar sticky-top navbar-expand-lg"
      style={{ backgroundColor: 'white', padding: '0.75rem 2rem' }}
    >
      <div
        className="d-flex container align-items-center justify-content-between w-100"
        style={{
          backgroundColor: '#1a1f2e',
          borderRadius: '50px',
          padding: '0.55rem 1rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link className="navbar-brand d-flex align-items-center text-decoration-none" to={homePath}>
          <img src="/logo.png" alt="Sembuzz" style={{ height: '28px', width: 'auto', marginRight: '8px' }} />
          <span style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>Sembuzz</span>
          {brandExtra}
        </Link>
        {children}
      </div>
    </nav>
  );
}
