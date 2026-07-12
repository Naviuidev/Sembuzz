import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AdminActionNotificationsBell,
  type AdminActionItemsRole,
} from './AdminActionNotificationsBell';

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
}: {
  role: AdminActionItemsRole;
  onLogout: () => void;
  logoutLabel?: string;
  compactLogout?: boolean;
}) {
  return (
    <div className="d-flex align-items-center">
      <AdminActionNotificationsBell role={role} />
      <LogoutButton onClick={onLogout} label={logoutLabel} compact={compactLogout} />
    </div>
  );
}

function LogoutButton({
  onClick,
  label,
  compact,
}: {
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
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
}: {
  homePath: string;
  brandExtra?: ReactNode;
  children: ReactNode;
}) {
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
