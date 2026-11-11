import { useMemo, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { MASTER_ADMIN_SCHOOL_SECTIONS } from '../constants/masterAdminSchoolSections';
import { useMasterAdminAuth } from '../contexts/MasterAdminAuthContext';
import { isPlatformMasterAdmin } from '../utils/masterAdminPortalAccess';
import { masterAdminDashboardService } from '../services/master-admin-dashboard.service';
import { imageSrc } from '../utils/image';

function statValue(loading: boolean, value: number | undefined) {
  if (loading || value === undefined) return '…';
  return value.toLocaleString();
}

export const MasterAdminDashboard = () => {
  const { user } = useMasterAdminAuth();
  const navigate = useNavigate();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'dashboard', 'summary'],
    queryFn: masterAdminDashboardService.getSummary,
    staleTime: 60 * 1000,
  });

  const toolLinks = useMemo(() => {
    return MASTER_ADMIN_SCHOOL_SECTIONS.map((section) => {
      let meta = `Open ${section.label.toLowerCase()} tools`;
      if (summary) {
        switch (section.id) {
          case 'posts':
            meta = `${summary.posts.pending} pending · ${summary.posts.published} published`;
            break;
          case 'users':
            meta = `${summary.users.toLocaleString()} registered users platform-wide`;
            break;
          case 'blogs':
            meta = `${summary.blogs.savedDrafts} saved drafts · ${summary.blogs.total} total`;
            break;
          case 'upcoming':
            meta = `${summary.upcoming} scheduled items`;
            break;
          case 'external-config':
            meta = `${summary.external.pendingTotal} pending external approvals`;
            break;
          case 'raise-request':
            meta = 'All queries and contact developer requests';
            break;
          default:
            break;
        }
      } else if (isLoading) {
        meta = 'Loading…';
      }
      return {
        to: `/master-admin/${section.id}`,
        icon: section.icon,
        title: section.label,
        meta,
      };
    });
  }, [summary, isLoading]);

  return (
    <MasterAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">Welcome back, {user?.name ?? 'Master Admin'}</h1>
        <p className="admin-page-subtitle">
          {isPlatformMasterAdmin(user)
            ? 'Cross-school overview for SemBuzz. Jump to a tool in the sidebar or pick a school below to manage school-level data.'
            : user?.schoolName
              ? `Overview for ${user.schoolName}. School pickers and data are limited to this school.`
              : 'School-scoped master admin overview.'}
        </p>
      </header>

      {isError ? (
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__body">
            <p className="admin-form-hint admin-form-hint--error mb-0">Could not load dashboard summary. Refresh to try again.</p>
          </div>
        </section>
      ) : (
        <div className="admin-analytics-stat-grid admin-category-dashboard__stats" style={panelStyle}>
          <div className="admin-analytics-stat admin-analytics-stat--scope">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Schools</span>
              <i className="bi bi-buildings admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{statValue(isLoading, summary?.schools.total)}</p>
            <p className="admin-analytics-stat__hint">
              {isLoading
                ? 'Loading…'
                : `${summary?.schools.active ?? 0} active · ${summary?.schools.inactive ?? 0} inactive`}
            </p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--comments">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Registered users</span>
              <i className="bi bi-people admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{statValue(isLoading, summary?.users)}</p>
            <p className="admin-analytics-stat__hint">Students & parents</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--likes">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Pending posts</span>
              <i className="bi bi-hourglass-split admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{statValue(isLoading, summary?.posts.pending)}</p>
            <p className="admin-analytics-stat__hint">
              {isLoading ? '…' : `${summary?.posts.published ?? 0} published across schools`}
            </p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--saved">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Blog drafts</span>
              <i className="bi bi-journal-text admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{statValue(isLoading, summary?.blogs.savedDrafts)}</p>
            <p className="admin-analytics-stat__hint">Saved, not yet published</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--scope">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">External queue</span>
              <i className="bi bi-box-arrow-in-right admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{statValue(isLoading, summary?.external.pendingTotal)}</p>
            <p className="admin-analytics-stat__hint">Pipeline & post requests</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--comments">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Upcoming news</span>
              <i className="bi bi-calendar-event admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{statValue(isLoading, summary?.upcoming)}</p>
            <p className="admin-analytics-stat__hint">Scheduled items</p>
          </div>
        </div>
      )}

      <div className="admin-dashboard-columns">
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Your account</h2>
            <span className="admin-pill admin-pill--neutral">Master Admin</span>
          </div>
          <div className="admin-panel__body">
            <div className="admin-detail-grid">
              <div>
                <span className="admin-detail-label">Display name</span>
                <p className="admin-detail-value mb-0">{user?.name ?? 'Master Admin'}</p>
              </div>
              <div>
                <span className="admin-detail-label">Login ID</span>
                <p className="admin-detail-value admin-detail-value--mono mb-0">{user?.loginId ?? '—'}</p>
              </div>
              <div className="admin-detail-grid--full">
                <span className="admin-detail-label">Scope</span>
                <p className="admin-form-hint mb-0">
                  Full access to every school on the platform. Use <strong>Schools</strong> for per-school overview, or
                  the tools on the right for cross-school hubs (posts, users, blogs, and more).
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Quick links</h2>
          </div>
          <div className="admin-panel__body">
            <div className="admin-quick-links">
              <Link to="/master-admin/schools" className="admin-quick-link">
                <span className="admin-quick-link__icon" aria-hidden>
                  <i className="bi bi-buildings" />
                </span>
                <span className="admin-quick-link__body">
                  <p className="admin-quick-link__title">Schools</p>
                  <p className="admin-quick-link__meta">
                    {isLoading
                      ? 'Loading…'
                      : `${summary?.schools.total ?? 0} schools · open overview & per-school tools`}
                  </p>
                </span>
                <i className="bi bi-chevron-right admin-quick-link__chevron" aria-hidden />
              </Link>
              {toolLinks.map((link) => (
                <Link key={link.to} to={link.to} className="admin-quick-link">
                  <span className="admin-quick-link__icon" aria-hidden>
                    <i className={`bi ${link.icon}`} />
                  </span>
                  <span className="admin-quick-link__body">
                    <p className="admin-quick-link__title">{link.title}</p>
                    <p className="admin-quick-link__meta">{link.meta}</p>
                  </span>
                  <i className="bi bi-chevron-right admin-quick-link__chevron" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="admin-panel master-admin-schools-panel" style={panelStyle}>
        <div className="admin-panel__header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h2 className="admin-panel__title mb-0">Recently updated schools</h2>
          <Link to="/master-admin/schools" className="admin-btn-secondary btn-sm">
            View all schools
          </Link>
        </div>
        <div className="admin-panel__body">
          {isLoading ? (
            <p className="master-admin-detail-muted mb-0">Loading schools…</p>
          ) : !summary?.recentSchools.length ? (
            <p className="master-admin-detail-muted mb-0">No schools yet. Schools appear here when created in Super Admin.</p>
          ) : (
            <div className="row g-3 justify-content-center">
              {summary.recentSchools.map((school) => {
                const logoUrl = school.image ? imageSrc(school.image) : '';
                return (
                  <div key={school.id} className="col-6 col-md-4 col-lg-3 d-flex justify-content-center">
                    <button
                      type="button"
                      className={`admin-picker-card master-admin-school-card${school.isActive ? '' : ' master-admin-school-card--inactive'}`}
                      onClick={() => navigate(`/master-admin/schools/${school.id}`)}
                    >
                      <span className="master-admin-school-card__logo" aria-hidden>
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <i className="bi bi-building" />
                        )}
                      </span>
                      <p className="admin-picker-card__title mb-0">{school.name}</p>
                      <p className="admin-picker-card__meta mb-0">
                        {[school.city, school.state].filter(Boolean).join(', ') || school.refNum}
                      </p>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </MasterAdminLayout>
  );
};
