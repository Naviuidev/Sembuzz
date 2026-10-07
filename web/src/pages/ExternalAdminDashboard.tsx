import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ExternalAdminLayout } from '../components/ExternalAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { useExternalAdminAuth } from '../contexts/ExternalAdminAuthContext';

export const ExternalAdminDashboard = () => {
  const { user } = useExternalAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.external } as CSSProperties;

  const categories = user?.categories ?? [];
  const activeCount = useMemo(() => categories.filter((c) => c.isActive).length, [categories]);

  return (
    <ExternalAdminLayout>
      <div className="admin-category-dashboard admin-category-dashboard--compact">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Welcome back, {user?.name?.split(' ')[0] ?? 'there'}</h1>
          <p className="admin-page-subtitle">
            Your external categories on the public feed. Posting and analytics are coming next.
          </p>
        </header>

        <div
          className="admin-analytics-stat-grid admin-category-dashboard__stats admin-analytics-stat-grid--3"
          style={panelStyle}
        >
          <div className="admin-analytics-stat admin-analytics-stat--scope">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Categories</span>
              <i className="bi bi-folder2-open admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{categories.length}</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--likes">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Live on feed</span>
              <i className="bi bi-broadcast admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{activeCount}</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--comments">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Posts</span>
              <i className="bi bi-newspaper admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">—</p>
            <p className="admin-analytics-stat__hint">Coming soon</p>
          </div>
        </div>

        <section className="admin-panel admin-category-dashboard__categories" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Your categories</h2>
            <Link to="/external-admin/privacy" className="admin-btn-secondary admin-btn-sm">
              Pipeline access
            </Link>
          </div>
          <div className="admin-panel__body">
            {categories.length === 0 ? (
              <div className="admin-category-dashboard__empty">
                <i className="bi bi-inboxes admin-category-dashboard__empty-icon" aria-hidden />
                <p className="mb-0">No categories assigned yet.</p>
              </div>
            ) : (
              <div className="admin-category-dash-grid admin-category-dash-grid--compact">
                {categories.map((cat) => (
                  <article key={cat.id} className="admin-category-dash-card">
                    <h3 className="admin-category-dash-card__title">{cat.name}</h3>
                    <span
                      className={`admin-pill ${cat.isActive ? 'admin-pill--active' : 'admin-pill--inactive'}`}
                    >
                      {cat.isActive ? 'Live' : 'Hidden'}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </ExternalAdminLayout>
  );
};
