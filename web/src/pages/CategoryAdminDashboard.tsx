import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CategoryAdminLayout } from '../components/CategoryAdminLayout';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { categoryAdminCategoriesService } from '../services/category-admin-categories.service';
import { categoryAdminEventsService } from '../services/category-admin-events.service';
import { subCategoryAdminsService, type SubCategoryAdmin } from '../services/subcategory-admins.service';

function getSubCategoryNames(admin: SubCategoryAdmin): string[] {
  const names: string[] = [];
  if (admin.subCategory?.name) names.push(admin.subCategory.name);
  if (admin.subCategories?.length) {
    admin.subCategories.forEach((sc) => {
      if (sc.subCategory?.name && !names.includes(sc.subCategory.name)) {
        names.push(sc.subCategory.name);
      }
    });
  }
  return names;
}

const QUICK_LINKS = [
  {
    to: '/category-admin/posts',
    icon: 'bi-clock-history',
    title: 'Pending approvals',
    meta: (pending: number | undefined) =>
      pending === undefined ? 'Loading…' : `${pending} post${pending === 1 ? '' : 's'} · Review and approve`,
  },
  {
    to: '/category-admin/queries',
    icon: 'bi-chat-left-text',
    title: 'Queries',
    meta: () => 'Messages from subcategory admins and replies',
  },
  {
    to: '/category-admin/analytics',
    icon: 'bi-graph-up-arrow',
    title: 'Analytics',
    meta: () => 'Engagement across your categories',
  },
  {
    to: '/category-admin/privacy',
    icon: 'bi-shield-lock',
    title: 'Privacy & admins',
    meta: (admins: number | undefined) =>
      admins === undefined ? 'Loading…' : `${admins} subcategory admin${admins === 1 ? '' : 's'} · Manage access`,
  },
] as const;

export const CategoryAdminDashboard = () => {
  const { user, token } = useCategoryAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.category } as CSSProperties;

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['category-admin-categories', user?.id],
    queryFn: async () => {
      try {
        const list = await categoryAdminCategoriesService.getMyCategories();
        if (list && list.length > 0) return list;
      } catch {
        // fall back to primary
      }
      const primary = await categoryAdminCategoriesService.getMyCategory();
      return primary ? [primary] : [];
    },
    enabled: !!user?.categoryId,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const { data: subCategoryAdmins = [], isLoading: adminsLoading, error: adminsError } = useQuery({
    queryKey: ['category-admin', 'subcategory-admins', user?.id],
    queryFn: () => subCategoryAdminsService.getAll(),
    enabled: !!token,
  });

  const { data: pendingEvents, isLoading: pendingLoading } = useQuery({
    queryKey: ['category-admin', 'events', 'pending', 'dashboard-count'],
    queryFn: () => categoryAdminEventsService.getPending(),
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  const subcategoryCount = categories.reduce((sum, cat) => sum + (cat.subcategories?.length ?? 0), 0);
  const categoryCount = categories.length;
  const adminCount = adminsLoading ? undefined : subCategoryAdmins.length;
  const pendingCount = pendingLoading ? undefined : (pendingEvents?.length ?? 0);

  const metaForLink = (index: number) => {
    if (index === 0) return QUICK_LINKS[0].meta(pendingCount);
    if (index === 3) return QUICK_LINKS[3].meta(adminCount);
    return QUICK_LINKS[index].meta(undefined);
  };

  return (
    <CategoryAdminLayout>
      <div className="admin-category-dashboard">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Welcome back, {user?.name ?? 'Category Admin'}</h1>
          <p className="admin-page-subtitle">
            Overview of your categories, subcategories, and the admins you have granted access.
          </p>
        </header>

        <div className="admin-analytics-stat-grid admin-category-dashboard__stats" style={panelStyle}>
          <div className="admin-analytics-stat admin-analytics-stat--scope">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Categories</span>
              <i className="bi bi-folder2-open admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">
              {categoriesLoading ? '…' : categoryCount}
            </p>
            <p className="admin-analytics-stat__hint">Assigned to you</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--comments">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Subcategories</span>
              <i className="bi bi-diagram-3 admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">
              {categoriesLoading ? '…' : subcategoryCount}
            </p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--saved">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Subcategory admins</span>
              <i className="bi bi-people admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">
              {adminsLoading ? '…' : subCategoryAdmins.length}
            </p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--likes">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Pending approvals</span>
              <i className="bi bi-hourglass-split admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">
              {pendingLoading ? '…' : pendingCount}
            </p>
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
                  <span className="admin-detail-label">Primary category</span>
                  <p className="admin-detail-value mb-0">{user?.categoryName ?? '—'}</p>
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
            <h2 className="admin-panel__title">Categories you manage</h2>
          </div>
          <div className="admin-panel__body">
            {categoriesLoading ? (
              <p className="admin-form-hint mb-0">Loading categories…</p>
            ) : categories.length === 0 ? (
              <p className="admin-form-hint mb-0">{user?.categoryName ?? 'No categories assigned yet.'}</p>
            ) : (
              <div className="admin-category-dash-grid">
                {categories.map((cat) => (
                  <article key={cat.id} className="admin-category-dash-card">
                    <h3 className="admin-category-dash-card__title">{cat.name}</h3>
                    <p className="admin-form-hint mb-2">{cat.school?.name ?? user?.schoolName ?? '—'}</p>
                    {cat.subcategories && cat.subcategories.length > 0 ? (
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
            )}
          </div>
        </section>

        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <div>
              <h2 className="admin-panel__title">Subcategory admins</h2>
              <p className="admin-form-hint mb-0 mt-1">
                People who can post and manage content under your categories.
              </p>
            </div>
            <Link to="/category-admin/privacy" className="admin-btn-primary">
              Manage access
            </Link>
          </div>
          <div className="admin-panel__body admin-panel__body--flush-top">
            {adminsError ? (
              <div className="admin-notice admin-notice--muted mx-3 mt-3">
                <p className="admin-form-hint mb-0">
                  {(adminsError as { response?: { data?: { message?: string } }; message?: string })
                    ?.response?.data?.message ?? (adminsError as Error).message}
                </p>
              </div>
            ) : null}
            {adminsLoading ? (
              <p className="admin-form-hint px-3 py-4 mb-0">Loading subcategory admins…</p>
            ) : subCategoryAdmins.length === 0 ? (
              <div className="admin-category-dashboard__empty">
                <i className="bi bi-people admin-category-dashboard__empty-icon" aria-hidden />
                <p className="admin-form-hint mb-3">No subcategory admins yet.</p>
                <Link to="/category-admin/privacy" className="admin-btn-primary">
                  Add subcategory admin
                </Link>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Subcategories</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subCategoryAdmins.map((admin) => {
                      const subNames = getSubCategoryNames(admin);
                      return (
                        <tr key={admin.id}>
                          <td>
                            <span className="admin-table__strong">{admin.name}</span>
                          </td>
                          <td>{admin.email}</td>
                          <td>
                            {subNames.length > 0 ? (
                              <div className="admin-pill-row">
                                {subNames.map((name) => (
                                  <span key={name} className="admin-pill admin-pill--neutral">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="admin-form-hint">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </CategoryAdminLayout>
  );
};
