import type { CSSProperties, FormEvent } from 'react';
import {
  ADMIN_PORTAL_ACCENTS,
  ADMIN_PORTAL_LABELS,
  type AdminPortalKey,
} from '../constants/adminPortalTheme';
import { ADMIN_LOGIN_HERO_CONFIG, type AdminLoginVariant } from './AdminLoginShell';

export type AdminSetPasswordShellProps = {
  variant: AdminLoginVariant;
  subtitle: string;
  error: string;
  loading: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: (e: FormEvent) => void;
  submitLabel?: string;
  loadingLabel?: string;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <div className="admin-login-field">
      <label htmlFor={id}>{label}</label>
      <div className="admin-login-input-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="admin-login-input admin-login-input--password"
          required
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="admin-login-toggle-pw"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
        </button>
      </div>
    </div>
  );
}

export function AdminSetPasswordShell({
  variant,
  subtitle,
  error,
  loading,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onSubmit,
  submitLabel = 'Set password & continue',
  loadingLabel = 'Setting password…',
}: AdminSetPasswordShellProps) {
  const meta = ADMIN_LOGIN_HERO_CONFIG[variant];
  const accent = ADMIN_PORTAL_ACCENTS[variant as AdminPortalKey];
  const badge = ADMIN_PORTAL_LABELS[variant as AdminPortalKey];
  const year = new Date().getFullYear();
  const style = { '--admin-accent': accent } as CSSProperties;

  return (
    <div className="admin-login-page" style={style}>
      <aside className="admin-login-hero">
        <div className="admin-login-hero-noise" aria-hidden />
        <div className="admin-login-hero-curves" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="admin-login-hero-body">
          <div className="admin-login-hero-icon" aria-hidden>
            ✦
          </div>
          <h1>{meta.heroGreeting}</h1>
          <p>{meta.heroSubtitle}</p>
        </div>
        <p className="admin-login-hero-footer">© {year} SemBuzz. All rights reserved.</p>
      </aside>

      <main className="admin-login-panel">
        <div className="admin-login-form-wrap">
          <div className="admin-login-logo">SemBuzz</div>
          <h2>Set your password</h2>
          <p className="admin-login-subtitle">
            <strong>{badge}</strong>
            {' · '}
            {subtitle}
          </p>

          <div className="admin-login-callout" role="note">
            <strong>First login</strong>
            <ul>
              <li>Use the temporary password from your welcome email</li>
              <li>Choose a new password with at least 8 characters</li>
            </ul>
          </div>

          {error ? (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit}>
            <PasswordField
              id={`${variant}-set-password-current`}
              label="Temporary password"
              value={currentPassword}
              onChange={onCurrentPasswordChange}
              show={showCurrentPassword}
              onToggle={onToggleCurrentPassword}
              placeholder="Temporary password"
              autoComplete="current-password"
            />
            <PasswordField
              id={`${variant}-set-password-new`}
              label="New password"
              value={newPassword}
              onChange={onNewPasswordChange}
              show={showNewPassword}
              onToggle={onToggleNewPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
            />
            <PasswordField
              id={`${variant}-set-password-confirm`}
              label="Confirm new password"
              value={confirmPassword}
              onChange={onConfirmPasswordChange}
              show={showConfirmPassword}
              onToggle={onToggleConfirmPassword}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              minLength={8}
            />

            <button type="submit" className="admin-login-submit" disabled={loading}>
              {loading ? loadingLabel : submitLabel}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

/** Full-page loading state matching admin login chrome */
export function AdminSetPasswordShellLoading({ variant }: { variant: AdminLoginVariant }) {
  const meta = ADMIN_LOGIN_HERO_CONFIG[variant];
  const accent = ADMIN_PORTAL_ACCENTS[variant as AdminPortalKey];
  const year = new Date().getFullYear();
  const style = { '--admin-accent': accent } as CSSProperties;

  return (
    <div className="admin-login-page" style={style}>
      <aside className="admin-login-hero">
        <div className="admin-login-hero-noise" aria-hidden />
        <div className="admin-login-hero-curves" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="admin-login-hero-body">
          <div className="admin-login-hero-icon" aria-hidden>✦</div>
          <h1>{meta.heroGreeting}</h1>
          <p>{meta.heroSubtitle}</p>
        </div>
        <p className="admin-login-hero-footer">© {year} SemBuzz. All rights reserved.</p>
      </aside>
      <main className="admin-login-panel admin-login-panel--centered">
        <p className="admin-login-loading-text">Loading…</p>
      </main>
    </div>
  );
}
