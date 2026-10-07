import { useEffect, useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { subcategoryAdminEventsService } from '../services/subcategory-admin-events.service';
import type { SubCategoryAdminUser } from '../services/subcategory-admin-auth.service';

type CategoryRow = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

function buildCategoriesData(user: SubCategoryAdminUser | null): CategoryRow[] {
  if (!user) return [];
  if (user.categoriesWithSubcategories && user.categoriesWithSubcategories.length > 0) {
    return user.categoriesWithSubcategories;
  }
  if (!user.categoryName) return [];
  const subcategories =
    user.subCategories && user.subCategories.length > 0
      ? user.subCategories.map((sc) => ({ id: sc.id, name: sc.name }))
      : [{ id: user.subCategoryId, name: user.subCategoryName }];
  return [
    {
      id: user.categoryId,
      name: user.categoryName,
      subcategories,
    },
  ];
}

const QUICK_LINKS = [
  {
    to: '/subcategory-admin/posts',
    icon: 'bi-plus-circle',
    title: 'Post the event',
    meta: (pending: number | undefined, reverted: number | undefined) => {
      if (pending === undefined || reverted === undefined) return 'Loading status…';
      const parts: string[] = [];
      if (pending > 0) parts.push(`${pending} pending`);
      if (reverted > 0) parts.push(`${reverted} need correction`);
      return parts.length > 0 ? parts.join(' · ') : 'Create or resubmit posts';
    },
  },
  {
    to: '/subcategory-admin/blogs',
    icon: 'bi-journal-text',
    title: 'Blogs',
    meta: () => 'Write and manage blog posts for your subcategories',
  },
  {
    to: '/subcategory-admin/analytics',
    icon: 'bi-graph-up-arrow',
    title: 'Analytics',
    meta: () => 'Views and engagement on approved content',
  },
  {
    to: '/subcategory-admin/queries',
    icon: 'bi-chat-left-text',
    title: 'Queries',
    meta: () => 'Messages from school and category admins',
  },
  {
    to: '/subcategory-admin/raise-query',
    icon: 'bi-question-circle',
    title: 'Raise a query',
    meta: () => 'Contact category admin, school admin, or super admin',
  },
  {
    to: '/subcategory-admin/privacy',
    icon: 'bi-shield-lock',
    title: 'Privacy',
    meta: () => 'Messaging settings and your admin identity',
  },
  {
    to: '/subcategory-admin/external-config',
    icon: 'bi-box-arrow-in-right',
    title: 'External config',
    meta: () => 'External category names and approved external posts',
  },
] as const;

export const SubCategoryAdminDashboard = () => {
  const { user, token, refreshUser } = useSubCategoryAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.subcategory } as CSSProperties;

  useEffect(() => {
    void refreshUser().catch((error) => {
      console.error('Failed to refresh user data:', error);
    });
  }, [refreshUser]);

  const categoriesData = useMemo(() => buildCategoriesData(user), [user]);

  const subcategoryCount = useMemo(
    () => categoriesData.reduce((sum, cat) => sum + cat.subcategories.length, 0),
    [categoriesData],
  );

  const { data: pendingEvents, isLoading: pendingLoading } = useQuery({
    queryKey: ['subcategory-admin', 'events', 'pending', 'dashboard-count'],
    queryFn: () => subcategoryAdminEventsService.getPending(),
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  const { data: revertedEvents, isLoading: revertedLoading } = useQuery({
    queryKey: ['subcategory-admin', 'events', 'reverted', 'dashboard-count'],
    queryFn: () => subcategoryAdminEventsService.getReverted(),
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  const { data: approvedEvents, isLoading: approvedLoading } = useQuery({
    queryKey: ['subcategory-admin', 'events', 'approved', 'dashboard-count'],
    queryFn: () => subcategoryAdminEventsService.getApproved(),
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  const pendingCount = pendingLoading ? undefined : (pendingEvents?.length ?? 0);
  const revertedCount = revertedLoading ? undefined : (revertedEvents?.length ?? 0);
  const approvedCount = approvedLoading ? undefined : (approvedEvents?.length ?? 0);

  const metaForLink = (index: number) => {
    if (index === 0) return QUICK_LINKS[0].meta(pendingCount, revertedCount);
    return QUICK_LINKS[index].meta(undefined, undefined);
  };

  const handleRefresh = () => {
    void refreshUser().catch((error) => {
      console.error('Failed to refresh:', error);
    });
  };

  return (
    <SubCategoryAdminLayout>
      <div className="admin-category-dashboard">
        <header className="admin-page-header" style={panelStyle}>
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h1 className="admin-page-title">Welcome back, {user?.name ?? 'Subcategory Admin'}</h1>
              <p className="admin-page-subtitle">
                Your subcategories, posting status, and shortcuts to manage events, blogs, and messaging.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleRefresh}
              title="Refresh to see latest subcategory access"
            >
              <i className="bi bi-arrow-clockwise me-2" aria-hidden />
              Refresh
            </button>
          </div>
        </header>

        <div className="admin-analytics-stat-grid admin-category-dashboard__stats" style={panelStyle}>
          <div className="admin-analytics-stat admin-analytics-stat--scope">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Categories</span>
              <i className="bi bi-folder2-open admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{categoriesData.length}</p>
            <p className="admin-analytics-stat__hint">You have access to</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--comments">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Subcategories</span>
              <i className="bi bi-diagram-3 admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{subcategoryCount}</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--likes">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Pending approval</span>
              <i className="bi bi-hourglass-split admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{pendingLoading ? '…' : pendingCount}</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--saved">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Approved posts</span>
              <i className="bi bi-check2-circle admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{approvedLoading ? '…' : approvedCount}</p>
            {revertedCount !== undefined && revertedCount > 0 ? (
              <p className="admin-analytics-stat__hint">
                {revertedCount} correction{revertedCount === 1 ? '' : 's'} to review
              </p>
            ) : null}
          </div>
        </div>

        <div className="admin-dashboard-columns">
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Your profile</h2>
              {user?.schoolDomain ? (
                <span className="admin-pill admin-pill--neutral">{user.schoolDomain}</span>
              ) : null}
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
                  <span className="admin-detail-label">School</span>
                  <p className="admin-detail-value mb-0">{user?.schoolName ?? '—'}</p>
                </div>
                <div>
                  <span className="admin-detail-label">Category admin</span>
                  <p className="admin-detail-value mb-0">
                    {user?.categoryAdmin?.name ?? '—'}
                    {user?.categoryAdmin?.email ? (
                      <span className="admin-form-hint d-block">{user.categoryAdmin.email}</span>
                    ) : null}
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
                {QUICK_LINKS.map((link, index) => (
                  <Link key={link.to} to={link.to} className="admin-quick-link">
                    <span className="admin-quick-link__icon" aria-hidden>
                      <i className={`bi ${link.icon}`} />
                    </span>
                    <span className="admin-quick-link__body">
                      <p className="admin-quick-link__title">{link.title}</p>
                      <p className="admin-quick-link__meta">{metaForLink(index)}</p>
                    </span>
                    <i className="bi bi-chevron-right admin-quick-link__chevron" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="admin-panel admin-category-dashboard__categories" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Your access</h2>
            <p className="admin-form-hint mb-0 mt-1">Categories and subcategories you can post and manage under.</p>
          </div>
          <div className="admin-panel__body admin-panel__body--flush-top">
            {categoriesData.length === 0 ? (
              <div className="admin-category-dashboard__empty">
                <i className="bi bi-inbox admin-category-dashboard__empty-icon" aria-hidden />
                <p className="admin-form-hint mb-0">No categories or subcategories assigned yet.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Subcategories</th>
                      <th>Category admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesData.map((category) => (
                      <tr key={category.id}>
                        <td>
                          <span className="admin-table__strong">{category.name}</span>
                        </td>
                        <td>
                          {category.subcategories.length > 0 ? (
                            <div className="admin-pill-row">
                              {category.subcategories.map((subcategory) => (
                                <span key={subcategory.id} className="admin-pill admin-pill--neutral">
                                  {subcategory.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="admin-form-hint">No subcategories</span>
                          )}
                        </td>
                        <td>
                          <span className="admin-table__strong">{user?.categoryAdmin?.name ?? '—'}</span>
                          {user?.categoryAdmin?.email ? (
                            <div className="admin-form-hint">{user.categoryAdmin.email}</div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {categoriesData.length > 0 ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">By category</h2>
            </div>
            <div className="admin-panel__body">
              <div className="admin-category-dash-grid">
                {categoriesData.map((cat) => (
                  <article key={cat.id} className="admin-category-dash-card">
                    <h3 className="admin-category-dash-card__title">{cat.name}</h3>
                    <p className="admin-form-hint mb-2">{user?.schoolName ?? '—'}</p>
                    {cat.subcategories.length > 0 ? (
                      <div className="admin-pill-row">
                        {cat.subcategories.map((sc) => (
                          <span key={sc.id} className="admin-pill admin-pill--neutral">
                            {sc.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-form-hint mb-0">No subcategories in this category.</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </SubCategoryAdminLayout>
  );
};
