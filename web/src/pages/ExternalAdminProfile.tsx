import type { CSSProperties } from 'react';
import { ExternalAdminLayout } from '../components/ExternalAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { useExternalAdminAuth } from '../contexts/ExternalAdminAuthContext';

export const ExternalAdminProfile = () => {
  const { user } = useExternalAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.external } as CSSProperties;
  const categories = user?.categories ?? [];

  return (
    <ExternalAdminLayout>
      <div className="admin-category-dashboard admin-category-dashboard--compact">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Your profile</h1>
          <p className="admin-page-subtitle">Account details and categories assigned to your external admin access.</p>
        </header>

        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Account</h2>
            <span className="admin-pill admin-pill--neutral">External Admin</span>
          </div>
          <div className="admin-panel__body">
            <div className="admin-detail-grid">
              <div>
                <span className="admin-detail-label">Name</span>
                <p className="admin-detail-value mb-0">{user?.name ?? '—'}</p>
              </div>
              <div>
                <span className="admin-detail-label">Email</span>
                <p className="admin-detail-value mb-0">{user?.email ?? '—'}</p>
              </div>
              <div>
                <span className="admin-detail-label">Reference number</span>
                <p className="admin-detail-value mb-0 font-monospace">{user?.refNum ?? '—'}</p>
              </div>
              <div>
                <span className="admin-detail-label">Role</span>
                <p className="admin-detail-value mb-0">External Admin</p>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Assigned categories</h2>
            <span className="admin-pill admin-pill--feature">{categories.length}</span>
          </div>
          <div className="admin-panel__body">
            {categories.length === 0 ? (
              <p className="admin-form-hint mb-0">
                No categories linked yet. Contact your SemBuzz super admin to assign external categories.
              </p>
            ) : (
              <div className="admin-pill-row">
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    className={`admin-pill ${cat.isActive ? 'admin-pill--active' : 'admin-pill--inactive'}`}
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </ExternalAdminLayout>
  );
};
