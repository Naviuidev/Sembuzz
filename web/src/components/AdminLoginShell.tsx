import type { CSSProperties, FormEvent, ReactNode } from 'react';
import {
  ADMIN_PORTAL_ACCENTS,
  ADMIN_PORTAL_LABELS,
  type AdminPortalKey,
} from '../constants/adminPortalTheme';

export type AdminLoginVariant = AdminPortalKey;

export const ADMIN_LOGIN_HERO_CONFIG: Record<
  AdminLoginVariant,
  {
    heroGreeting: string;
    heroSubtitle: string;
  }
> = {
  super: {
    heroGreeting: 'Hello, Super Admin! 👋',
    heroSubtitle:
      'Manage schools, features, and platform settings from one secure place. Stay in control without the busywork.',
  },
  school: {
    heroGreeting: 'Hello, School Admin! 👋',
    heroSubtitle:
      'Run your school portal, categories, and student experience with tools built for campus teams.',
  },
  category: {
    heroGreeting: 'Hello, Category Admin! 👋',
    heroSubtitle:
      'Review news, manage subcategories, and keep your category feed accurate and on time.',
  },
  subcategory: {
    heroGreeting: 'Hello, Subcategory Admin! 👋',
    heroSubtitle:
      'Publish and approve news for your subcategory with a clear, focused workflow.',
  },
  ads: {
    heroGreeting: 'Hello, Ads Admin! 👋',
    heroSubtitle:
      'Create banner and sponsored placements that reach students when it matters most.',
  },
  external: {
    heroGreeting: 'Hello, External Admin! 👋',
    heroSubtitle:
      'Manage platform-wide external categories and content outside the school hierarchy.',
  },
};

export type AdminLoginShellProps = {
  variant: AdminLoginVariant;
  subtitle: string;
  error: string;
  loading: boolean;
  identifierLabel: string;
  identifierType?: 'email' | 'text';
  identifierId: string;
  identifierValue: string;
  onIdentifierChange: (value: string) => void;
  identifierPlaceholder?: string;
  password: string;
  onPasswordChange: (value: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmit: (e: FormEvent) => void;
  forgotPasswordHref?: string;
  footer?: ReactNode;
};

export function AdminLoginShell({
  variant,
  subtitle,
  error,
  loading,
  identifierLabel,
  identifierType = 'text',
  identifierId,
  identifierValue,
  onIdentifierChange,
  identifierPlaceholder,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  onSubmit,
  forgotPasswordHref,
  footer,
}: AdminLoginShellProps) {
  const meta = ADMIN_LOGIN_HERO_CONFIG[variant];
  const accent = ADMIN_PORTAL_ACCENTS[variant];
  const badge = ADMIN_PORTAL_LABELS[variant];
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
          <h2>Welcome Back!</h2>
          <p className="admin-login-subtitle">
            <strong>{badge}</strong>
            {' · '}
            {subtitle}
          </p>

          {error ? (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit}>
            <div className="admin-login-field">
              <label htmlFor={identifierId}>{identifierLabel}</label>
              <div className="admin-login-input-wrap">
                <input
                  id={identifierId}
                  type={identifierType}
                  className="admin-login-input"
                  required
                  value={identifierValue}
                  onChange={(e) => onIdentifierChange(e.target.value)}
                  placeholder={identifierPlaceholder ?? identifierLabel}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label htmlFor={`${identifierId}-password`}>Password</label>
              <div className="admin-login-input-wrap">
                <input
                  id={`${identifierId}-password`}
                  type={showPassword ? 'text' : 'password'}
                  className="admin-login-input admin-login-input--password"
                  required
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="admin-login-toggle-pw"
                  onClick={onTogglePassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="admin-login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login Now'}
            </button>

            {forgotPasswordHref ? (
              <div className="admin-login-forgot">
                Forget password? <a href={forgotPasswordHref}>Click here</a>
              </div>
            ) : null}
          </form>

          {footer ? <div className="admin-login-footer">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
