import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { MasterAdminSchoolSectionId } from '../../constants/masterAdminSchoolSections';
import { formatAdminRoleLabel } from '../../services/admin-email-change-requests.service';
import {
  masterAdminSchoolsService,
  type MasterAdminSchoolOverview,
  type MasterAdminSchoolPrivacyAdminRow,
} from '../../services/master-admin-schools.service';
import { imageSrc } from '../../utils/image';
import { formatSchoolTenure } from '../../utils/masterAdminSchoolTenure';
import { AdminEmailList, OverviewAccordion } from './masterAdminSchoolShared';

function formatPostDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function postStatusPill(status: string) {
  const map: Record<string, string> = {
    published: 'admin-pill admin-pill--status-done',
    approved: 'admin-pill admin-pill--status-done',
    scheduled: 'admin-pill admin-pill--status-progress',
    pending: 'admin-pill admin-pill--status-pending',
    draft: 'admin-pill admin-pill--status-pending',
  };
  const cls = map[status] ?? 'admin-pill admin-pill--neutral';
  return <span className={cls}>{status}</span>;
}

function enabledPill(enabled: boolean, on = 'Enabled', off = 'Disabled') {
  const cls = enabled ? 'admin-pill admin-pill--status-done' : 'admin-pill admin-pill--neutral';
  return <span className={cls}>{enabled ? on : off}</span>;
}

function MasterAdminTableShell({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: 'posts';
}) {
  const wrapClass =
    variant === 'posts' ? ' master-admin-school-table-wrap--posts' : '';
  const tableClass =
    variant === 'posts'
      ? ' master-admin-school-table master-admin-posts-table'
      : ' master-admin-school-table';
  return (
    <div className={`admin-table-wrap master-admin-school-table-wrap${wrapClass}`}>
      <table className={`admin-table${tableClass}`}>{children}</table>
    </div>
  );
}

function SectionPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="admin-panel master-admin-detail-panel">
      <div className="admin-panel__body master-admin-section-table-body">{children}</div>
    </section>
  );
}

function MasterAdminGuidedPlaceholder({ description }: { description: string }) {
  return (
    <SectionPanel>
      <p className="master-admin-detail-muted mb-2">{description}</p>
      <p className="admin-form-hint mb-0">
        Master Admin tools for this area are coming next — use this tab in the sidebar as your guide for upcoming work.
      </p>
    </SectionPanel>
  );
}

function blogStatusPill(status: string, published: boolean) {
  if (status === 'approved' && published) {
    return <span className="admin-pill admin-pill--status-done">published</span>;
  }
  const map: Record<string, string> = {
    approved: 'admin-pill admin-pill--status-done',
    pending: 'admin-pill admin-pill--status-pending',
    rejected: 'admin-pill admin-pill--neutral',
  };
  const cls = map[status] ?? 'admin-pill admin-pill--neutral';
  return <span className={cls}>{status}</span>;
}

function userStatusPill(status: string) {
  const map: Record<string, string> = {
    active: 'admin-pill admin-pill--status-done',
    pending_approval: 'admin-pill admin-pill--status-pending',
    pending_otp: 'admin-pill admin-pill--status-progress',
    rejected: 'admin-pill admin-pill--neutral',
  };
  const cls = map[status] ?? 'admin-pill admin-pill--neutral';
  const label = status.replace(/_/g, ' ');
  return <span className={cls}>{label}</span>;
}

function formatRegistrationMethod(method: string | null) {
  if (!method) return '—';
  if (method === 'school_domain') return 'School domain';
  if (method === 'gmail') return 'Gmail';
  return method;
}

function adCategoryLabel(row: {
  categoryAdmin: { category?: { name: string } | null } | null;
}) {
  return row.categoryAdmin?.category?.name ?? '—';
}

function adCreatedByLabel(row: {
  categoryAdmin: { name: string; email: string } | null;
  adsAdmin: { name: string; email: string } | null;
}) {
  return (
    row.categoryAdmin?.name ??
    row.adsAdmin?.name ??
    row.categoryAdmin?.email ??
    row.adsAdmin?.email ??
    '—'
  );
}

function TableViewLink({ href, ariaLabel }: { href: string | null | undefined; ariaLabel: string }) {
  if (!href) return <span className="master-admin-detail-muted">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="admin-table__link master-admin-posts-table__preview"
      aria-label={ariaLabel}
      title="View"
    >
      View
      <i className="bi bi-box-arrow-up-right" aria-hidden />
    </a>
  );
}

function firstLoginPill(isFirstLogin: boolean) {
  return enabledPill(!isFirstLogin, 'Password set', 'First login pending');
}

function emailRequestStatusLabel(status: string) {
  if (status === 'pending_new_email_otp') return 'Awaiting new email OTP';
  if (status === 'pending_otp') return 'Pending OTP';
  return 'Pending review';
}

function PrivacyAdminIdentityTable({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: MasterAdminSchoolPrivacyAdminRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <div>
        <p className="master-admin-category-block__label mb-2">{title}</p>
        <p className="master-admin-detail-muted mb-0">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div>
      <p className="master-admin-category-block__label mb-2">{title}</p>
      <MasterAdminTableShell variant="posts">
        <thead>
          <tr>
            <th>Name</th>
            <th>Scope</th>
            <th>User ID</th>
            <th>Email</th>
            <th>Status</th>
            <th>Login</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <span className="admin-table__strong">{row.name}</span>
              </td>
              <td>
                <span className="master-admin-table-meta">{row.scope}</span>
              </td>
              <td>
                <span className="admin-table__mono master-admin-table-meta">{row.platformUserId}</span>
              </td>
              <td>
                <a href={`mailto:${row.email}`} className="master-admin-table-admins__email">
                  {row.email}
                </a>
              </td>
              <td>{enabledPill(row.isActive, 'Active', 'Inactive')}</td>
              <td>{firstLoginPill(row.isFirstLogin)}</td>
            </tr>
          ))}
        </tbody>
      </MasterAdminTableShell>
    </div>
  );
}

export function PrivacySection({ schoolId }: { schoolId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools', schoolId, 'privacy'],
    queryFn: () => masterAdminSchoolsService.getPrivacy(schoolId),
  });

  if (isLoading) return <p className="master-admin-detail-muted mb-0">Loading privacy data…</p>;
  if (isError || !data) return <p className="master-admin-detail-muted mb-0">Could not load privacy data.</p>;

  const analyticsOn = data.enabledFeatures.some((f) => f.code.toUpperCase() === 'ANALYTICS');

  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <p className="master-admin-category-block__label mb-2">Enabled features</p>
        {data.enabledFeatures.length === 0 ? (
          <p className="master-admin-detail-muted mb-0">No features enabled for this school.</p>
        ) : (
          <div className="d-flex flex-wrap gap-2 mb-2">
            {data.enabledFeatures.map((f) => (
              <span key={f.code} className="master-admin-detail-feature-chip">
                {f.name}
              </span>
            ))}
          </div>
        )}
        {analyticsOn ? (
          <p className="master-admin-detail-muted small mb-0">
            Analytics is enabled. There is no separate analytics admin — school, category, and subcategory admins
            access analytics in their admin portals when permitted.
          </p>
        ) : null}
      </div>

      {data.emailChangeRequests.length > 0 ? (
        <div>
          <p className="master-admin-category-block__label mb-2">Pending email change requests</p>
          <MasterAdminTableShell variant="posts">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                <th>Current email</th>
                <th>Requested by</th>
                <th>Status</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {data.emailChangeRequests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <span className="admin-table__strong">{req.targetName}</span>
                  </td>
                  <td>
                    {formatAdminRoleLabel(
                      req.targetRole as 'category_admin' | 'subcategory_admin' | 'ads_admin',
                    )}
                  </td>
                  <td>{req.targetEmail}</td>
                  <td>{req.initiatedByName}</td>
                  <td>
                    <span className="admin-pill admin-pill--status-pending">{emailRequestStatusLabel(req.status)}</span>
                  </td>
                  <td className="master-admin-posts-table__published">{formatPostDate(req.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </MasterAdminTableShell>
        </div>
      ) : null}

      <PrivacyAdminIdentityTable
        title="School admin"
        rows={data.schoolAdmins}
        emptyLabel="No school admin assigned."
      />
      <PrivacyAdminIdentityTable
        title="Category admin"
        rows={data.categoryAdmins}
        emptyLabel="No category admins for this school."
      />
      <PrivacyAdminIdentityTable
        title="Subcategory admin"
        rows={data.subCategoryAdmins}
        emptyLabel="No subcategory admins for this school."
      />
      <PrivacyAdminIdentityTable
        title="Ads admin"
        rows={data.adsAdmins}
        emptyLabel="No ads admin configured (Ads feature may be off)."
      />
    </div>
  );
}

function SectionDataState({
  isLoading,
  isError,
  isEmpty,
  emptyLabel,
  loadingLabel = 'Loading…',
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyLabel: string;
  loadingLabel?: string;
  children: React.ReactNode;
}) {
  if (isLoading) return <p className="master-admin-detail-muted mb-0">{loadingLabel}</p>;
  if (isError) return <p className="master-admin-detail-muted mb-0">Could not load data.</p>;
  if (isEmpty) return <p className="master-admin-detail-muted mb-0">{emptyLabel}</p>;
  return <>{children}</>;
}

export function OverviewContent({ overview }: { overview: MasterAdminSchoolOverview }) {
  const { school, enabledFeatures, schoolAdmins, categories, counts } = overview;
  const logoUrl = school.image ? imageSrc(school.image) : '';
  const location = [school.city, school.state, school.country].filter(Boolean).join(', ');
  const subs = categories.flatMap((c) => c.subcategories.map((s) => ({ ...s, categoryName: c.name })));

  return (
    <div className="d-flex flex-column gap-3">
      <section className="admin-panel master-admin-detail-panel">
        <div className="admin-panel__body">
          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            <span className="master-admin-school-card__logo master-admin-detail-school-logo">
              {logoUrl ? <img src={logoUrl} alt="" /> : <i className="bi bi-building" aria-hidden />}
            </span>
            <div>
              <h2 className="master-admin-detail-school-name mb-1">{school.name}</h2>
              <p className="master-admin-detail-muted mb-0">
                {school.refNum}
                {location ? ` · ${location}` : null}
                {school.domain ? ` · ${school.domain}` : null}
              </p>
            </div>
            <span
              className={`master-admin-detail-status ms-auto${
                school.isActive ? ' master-admin-detail-status--active' : ''
              }`}
            >
              {school.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <dl className="row g-2 mb-0 master-admin-detail-meta">
            <dt className="col-sm-3">Tenure</dt>
            <dd className="col-sm-9">{formatSchoolTenure(school.createdAt, school.tenure)}</dd>
            <dt className="col-sm-3">Enabled features</dt>
            <dd className="col-sm-9">
              {enabledFeatures.length ? (
                <div className="d-flex flex-wrap gap-2">
                  {enabledFeatures.map((f) => (
                    <span key={f.code} className="master-admin-detail-feature-chip">
                      {f.name}
                    </span>
                  ))}
                </div>
              ) : (
                '—'
              )}
            </dd>
          </dl>
        </div>
      </section>

      <div className="master-admin-overview-accordion-stack">
        <OverviewAccordion title="School admin" meta={`${schoolAdmins.length} admin${schoolAdmins.length === 1 ? '' : 's'}`}>
          <AdminEmailList admins={schoolAdmins} emptyLabel="No school admin assigned." />
        </OverviewAccordion>
        <OverviewAccordion title="Categories" meta={`${counts.categories} categories`}>
          {categories.length === 0 ? (
            <p className="master-admin-detail-muted mb-0">No categories yet.</p>
          ) : (
            <ul className="list-unstyled mb-0 master-admin-accordion-entity-list">
              {categories.map((cat) => (
                <li key={cat.id} className="master-admin-accordion-entity">
                  <p className="master-admin-accordion-entity__name">{cat.name}</p>
                  <p className="master-admin-category-block__label">Category admin</p>
                  <AdminEmailList admins={cat.admins} emptyLabel="No category admin assigned." />
                </li>
              ))}
            </ul>
          )}
        </OverviewAccordion>
        <OverviewAccordion title="Subcategories" meta={`${counts.subcategories} subcategories`}>
          {subs.length === 0 ? (
            <p className="master-admin-detail-muted mb-0">No subcategories yet.</p>
          ) : (
            <ul className="list-unstyled mb-0 master-admin-accordion-entity-list">
              {subs.map((sub) => (
                <li key={sub.id} className="master-admin-accordion-entity">
                  <p className="master-admin-accordion-entity__name">
                    {sub.name}
                    <span className="master-admin-detail-muted"> · {sub.categoryName}</span>
                  </p>
                  <p className="master-admin-category-block__label">Subcategory admin</p>
                  <AdminEmailList admins={sub.admins} emptyLabel="No subcategory admin assigned." />
                </li>
              ))}
            </ul>
          )}
        </OverviewAccordion>
      </div>
    </div>
  );
}

function TableAdminsCell({ admins, emptyLabel }: { admins: MasterAdminSchoolOverview['categories'][0]['admins']; emptyLabel: string }) {
  if (admins.length === 0) {
    return <span className="master-admin-detail-muted">{emptyLabel}</span>;
  }
  return (
    <ul className="master-admin-table-admins list-unstyled mb-0">
      {admins.map((admin) => (
        <li key={admin.id}>
          <span className="admin-table__strong">{admin.name}</span>
          {!admin.isActive ? (
            <span className="master-admin-detail-badge-inactive ms-1">Inactive</span>
          ) : null}
          <a href={`mailto:${admin.email}`} className="master-admin-table-admins__email">
            {admin.email}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CategoriesSection({ overview }: { overview: MasterAdminSchoolOverview }) {
  const { categories } = overview;
  if (categories.length === 0) {
    return <p className="master-admin-detail-muted mb-0">No categories yet.</p>;
  }
  return (
    <MasterAdminTableShell variant="posts">
      <thead>
        <tr>
          <th>Category</th>
          <th>Category admin</th>
          <th>Subcategories</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((cat) => (
          <tr key={cat.id}>
            <td>
              <span className="admin-table__strong">{cat.name}</span>
              <span className="master-admin-table-meta d-block">
                {cat.subcategories.length} subcategor{cat.subcategories.length === 1 ? 'y' : 'ies'}
              </span>
            </td>
            <td className="master-admin-school-table__admins">
              <TableAdminsCell admins={cat.admins} emptyLabel="No category admin" />
            </td>
            <td className="master-admin-school-table__subs">
              {cat.subcategories.length === 0 ? (
                <span className="master-admin-detail-muted">—</span>
              ) : (
                <div className="master-admin-table-sub-chips">
                  {cat.subcategories.map((sub) => (
                    <span key={sub.id} className="master-admin-table-sub-chip">
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </MasterAdminTableShell>
  );
}

export function SubcategoriesSection({ overview }: { overview: MasterAdminSchoolOverview }) {
  const subs = useMemo(
    () => overview.categories.flatMap((c) => c.subcategories.map((s) => ({ ...s, categoryName: c.name }))),
    [overview.categories],
  );
  if (subs.length === 0) {
    return <p className="master-admin-detail-muted mb-0">No subcategories yet.</p>;
  }
  return (
    <MasterAdminTableShell variant="posts">
      <thead>
        <tr>
          <th>Subcategory</th>
          <th>Parent category</th>
          <th>Subcategory admin</th>
          <th className="text-end">Posts</th>
        </tr>
      </thead>
      <tbody>
        {subs.map((sub) => (
          <tr key={sub.id}>
            <td>
              <span className="admin-table__strong">{sub.name}</span>
            </td>
            <td>
              <span className="master-admin-table-parent-chip">{sub.categoryName}</span>
            </td>
            <td className="master-admin-school-table__admins">
              <TableAdminsCell admins={sub.admins} emptyLabel="No subcategory admin" />
            </td>
            <td className="text-end">
              <span className="master-admin-table-meta">{sub.postCount}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </MasterAdminTableShell>
  );
}

export function PostsSection({ schoolId }: { schoolId: string }) {
  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools', schoolId, 'posts'],
    queryFn: () => masterAdminSchoolsService.listPosts(schoolId),
  });

  if (isLoading) return <p className="master-admin-detail-muted mb-0">Loading posts…</p>;
  if (isError) return <p className="master-admin-detail-muted mb-0">Could not load posts.</p>;
  if (posts.length === 0) return <p className="master-admin-detail-muted mb-0">No posts yet.</p>;

  return (
    <MasterAdminTableShell variant="posts">
      <thead>
        <tr>
          <th className="master-admin-posts-table__col-title">Title</th>
          <th>Category</th>
          <th>Subcategory</th>
          <th>Posted by</th>
          <th>Published</th>
          <th>Status</th>
          <th className="text-end master-admin-posts-table__col-view">View</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => {
          const author =
            post.subCategoryAdmin?.name ??
            post.subCategoryAdmin?.email ??
            post.schoolAdmin?.name ??
            post.schoolAdmin?.email ??
            '—';
          const viewUrl = `/master-admin/view-post/${post.id}?schoolId=${encodeURIComponent(schoolId)}`;
          return (
            <tr key={post.id}>
              <td className="master-admin-posts-table__col-title">
                <span className="admin-table__strong">{post.title}</span>
              </td>
              <td>{post.subCategory?.category?.name ?? '—'}</td>
              <td>{post.subCategory?.name ?? '—'}</td>
              <td>{author}</td>
              <td className="master-admin-posts-table__published">
                {formatPostDate(post.publishedAt ?? post.publishAt ?? post.createdAt)}
              </td>
              <td>{postStatusPill(post.status)}</td>
              <td className="text-end master-admin-posts-table__col-view">
                <TableViewLink href={viewUrl} ariaLabel={`View live preview: ${post.title}`} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </MasterAdminTableShell>
  );
}

export function UsersSection({ schoolId }: { schoolId: string }) {
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools', schoolId, 'users'],
    queryFn: () => masterAdminSchoolsService.listUsers(schoolId),
  });

  return (
    <SectionDataState
      isLoading={isLoading}
      isError={isError}
      isEmpty={users.length === 0}
      emptyLabel="No registered users yet."
      loadingLabel="Loading users…"
    >
      <MasterAdminTableShell variant="posts">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Registration</th>
            <th>Joined</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <span className="admin-table__strong">{user.name}</span>
              </td>
              <td>
                <a href={`mailto:${user.email}`} className="master-admin-table-admins__email">
                  {user.email}
                </a>
              </td>
              <td>{formatRegistrationMethod(user.registrationMethod)}</td>
              <td className="master-admin-posts-table__published">{formatPostDate(user.createdAt)}</td>
              <td>{userStatusPill(user.status)}</td>
            </tr>
          ))}
        </tbody>
      </MasterAdminTableShell>
    </SectionDataState>
  );
}

export function BlogsSection({ schoolId }: { schoolId: string }) {
  const { data: blogs = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools', schoolId, 'blogs'],
    queryFn: () => masterAdminSchoolsService.listBlogs(schoolId),
  });

  return (
    <SectionDataState
      isLoading={isLoading}
      isError={isError}
      isEmpty={blogs.length === 0}
      emptyLabel="No blog posts yet."
      loadingLabel="Loading blogs…"
    >
      <MasterAdminTableShell variant="posts">
        <thead>
          <tr>
            <th className="master-admin-posts-table__col-title">Title</th>
            <th>Category</th>
            <th>Subcategory</th>
            <th>Posted by</th>
            <th>Published</th>
            <th>Status</th>
            <th className="text-end master-admin-posts-table__col-view">View</th>
          </tr>
        </thead>
        <tbody>
          {blogs.map((blog) => {
            const author = blog.subCategoryAdmin?.name ?? blog.subCategoryAdmin?.email ?? '—';
            const liveUrl = blog.status === 'approved' && blog.published ? `/blogs/${blog.id}` : null;
            return (
              <tr key={blog.id}>
                <td className="master-admin-posts-table__col-title">
                  <span className="admin-table__strong">{blog.title}</span>
                </td>
                <td>{blog.category?.name ?? '—'}</td>
                <td>{blog.subCategory?.name ?? '—'}</td>
                <td>{author}</td>
                <td className="master-admin-posts-table__published">
                  {formatPostDate(blog.publishedAt ?? blog.createdAt)}
                </td>
                <td>{blogStatusPill(blog.status, blog.published)}</td>
                <td className="text-end master-admin-posts-table__col-view">
                  <TableViewLink href={liveUrl} ariaLabel={`View blog: ${blog.title}`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </MasterAdminTableShell>
    </SectionDataState>
  );
}

export function UpcomingSection({ schoolId }: { schoolId: string }) {
  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools', schoolId, 'upcoming'],
    queryFn: () => masterAdminSchoolsService.listUpcoming(schoolId),
  });

  return (
    <SectionDataState
      isLoading={isLoading}
      isError={isError}
      isEmpty={items.length === 0}
      emptyLabel="No upcoming news scheduled."
      loadingLabel="Loading upcoming news…"
    >
      <MasterAdminTableShell variant="posts">
        <thead>
          <tr>
            <th className="master-admin-posts-table__col-title">Title</th>
            <th>Category</th>
            <th>Subcategory</th>
            <th>Scheduled for</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="master-admin-posts-table__col-title">
                <span className="admin-table__strong">{item.title}</span>
              </td>
              <td>{item.category?.name ?? '—'}</td>
              <td>{item.subCategory?.name ?? '—'}</td>
              <td className="master-admin-posts-table__published">{formatPostDate(item.scheduledTo)}</td>
              <td className="master-admin-posts-table__published">{formatPostDate(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </MasterAdminTableShell>
    </SectionDataState>
  );
}

export function AdsSection({ schoolId }: { schoolId: string }) {
  const bannerQuery = useQuery({
    queryKey: ['master-admin', 'schools', schoolId, 'banner-ads'],
    queryFn: () => masterAdminSchoolsService.listBannerAds(schoolId),
  });
  const sponsoredQuery = useQuery({
    queryKey: ['master-admin', 'schools', schoolId, 'sponsored-ads'],
    queryFn: () => masterAdminSchoolsService.listSponsoredAds(schoolId),
  });

  const isLoading = bannerQuery.isLoading || sponsoredQuery.isLoading;
  const isError = bannerQuery.isError || sponsoredQuery.isError;
  const banners = bannerQuery.data ?? [];
  const sponsored = sponsoredQuery.data ?? [];

  if (isLoading) return <p className="master-admin-detail-muted mb-0">Loading ads…</p>;
  if (isError) return <p className="master-admin-detail-muted mb-0">Could not load ads.</p>;
  if (banners.length === 0 && sponsored.length === 0) {
    return <p className="master-admin-detail-muted mb-0">No banner or sponsored ads yet.</p>;
  }

  return (
      <div className="d-flex flex-column gap-3">
        {banners.length > 0 ? (
          <div>
            <p className="master-admin-category-block__label mb-2">Banner ads</p>
            <MasterAdminTableShell variant="posts">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Created by</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Created</th>
                  <th className="text-end master-admin-posts-table__col-view">Link</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((ad) => (
                  <tr key={ad.id}>
                    <td>{adCategoryLabel(ad)}</td>
                    <td>{adCreatedByLabel(ad)}</td>
                    <td className="master-admin-posts-table__published">{formatPostDate(ad.startAt)}</td>
                    <td className="master-admin-posts-table__published">{formatPostDate(ad.endAt)}</td>
                    <td className="master-admin-posts-table__published">{formatPostDate(ad.createdAt)}</td>
                    <td className="text-end master-admin-posts-table__col-view">
                      <TableViewLink href={ad.externalLink} ariaLabel="Open banner ad link" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </MasterAdminTableShell>
          </div>
        ) : null}
        {sponsored.length > 0 ? (
          <div>
            <p className="master-admin-category-block__label mb-2">Sponsored ads</p>
            <MasterAdminTableShell variant="posts">
              <thead>
                <tr>
                  <th className="master-admin-posts-table__col-title">Title</th>
                  <th>Category</th>
                  <th>Created by</th>
                  <th>Start</th>
                  <th>End</th>
                  <th className="text-end master-admin-posts-table__col-view">View</th>
                </tr>
              </thead>
              <tbody>
                {sponsored.map((ad) => (
                  <tr key={ad.id}>
                    <td className="master-admin-posts-table__col-title">
                      <span className="admin-table__strong">{ad.title ?? 'Sponsored ad'}</span>
                    </td>
                    <td>{adCategoryLabel(ad)}</td>
                    <td>{adCreatedByLabel(ad)}</td>
                    <td className="master-admin-posts-table__published">{formatPostDate(ad.startAt)}</td>
                    <td className="master-admin-posts-table__published">{formatPostDate(ad.endAt)}</td>
                    <td className="text-end master-admin-posts-table__col-view">
                      <TableViewLink
                        href={ad.externalLink ?? `/events?schoolId=${encodeURIComponent(schoolId)}`}
                        ariaLabel={`View sponsored ad: ${ad.title ?? 'Ad'}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </MasterAdminTableShell>
          </div>
        ) : null}
      </div>
  );
}

export function MasterAdminSchoolSectionContent({
  section,
  overview,
  schoolId,
}: {
  section: MasterAdminSchoolSectionId;
  overview: MasterAdminSchoolOverview;
  schoolId: string;
}) {
  const { socialAccounts, enabledFeatures } = overview;

  if (section === 'overview') return <OverviewContent overview={overview} />;
  if (section === 'categories') {
    return (
      <SectionPanel>
        <div className="d-flex flex-column gap-3">
          <CategoriesSection overview={overview} />
          <div>
            <p className="master-admin-category-block__label mb-2">Subcategories</p>
            <SubcategoriesSection overview={overview} />
          </div>
        </div>
      </SectionPanel>
    );
  }
  if (section === 'posts') {
    return (
      <SectionPanel>
        <PostsSection schoolId={schoolId} />
      </SectionPanel>
    );
  }
  if (section === 'users') {
    return (
      <SectionPanel>
        <UsersSection schoolId={schoolId} />
      </SectionPanel>
    );
  }
  if (section === 'blogs') {
    return (
      <SectionPanel>
        <BlogsSection schoolId={schoolId} />
      </SectionPanel>
    );
  }
  if (section === 'upcoming') {
    return (
      <SectionPanel>
        <UpcomingSection schoolId={schoolId} />
      </SectionPanel>
    );
  }
  if (section === 'analytics') {
    const analyticsOn = enabledFeatures.some((f) => f.code.toUpperCase() === 'ANALYTICS');
    return (
      <SectionPanel>
        {enabledFeatures.length === 0 ? (
          <p className="master-admin-detail-muted mb-0">No features enabled.</p>
        ) : (
          <MasterAdminTableShell variant="posts">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Code</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enabledFeatures.map((f) => (
                <tr key={f.code}>
                  <td>
                    <span className="admin-table__strong">{f.name}</span>
                  </td>
                  <td>
                    <span className="master-admin-table-meta">{f.code}</span>
                  </td>
                  <td>
                    {f.code.toUpperCase() === 'ANALYTICS'
                      ? enabledPill(analyticsOn)
                      : enabledPill(true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </MasterAdminTableShell>
        )}
      </SectionPanel>
    );
  }
  if (section === 'social') {
    return (
      <SectionPanel>
        {socialAccounts.length === 0 ? (
          <p className="master-admin-detail-muted mb-0">No social accounts linked.</p>
        ) : (
          <MasterAdminTableShell variant="posts">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Page name</th>
                <th>Link</th>
                <th className="text-end master-admin-posts-table__col-view">View</th>
              </tr>
            </thead>
            <tbody>
              {socialAccounts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className="admin-table__strong">
                      <i className={`bi ${a.icon} me-2 text-muted`} aria-hidden />
                      {a.platformName}
                    </span>
                  </td>
                  <td>{a.pageName}</td>
                  <td>
                    <span className="master-admin-table-meta text-truncate d-inline-block" style={{ maxWidth: '12rem' }}>
                      {a.link}
                    </span>
                  </td>
                  <td className="text-end master-admin-posts-table__col-view">
                    <TableViewLink href={a.link} ariaLabel={`Open ${a.platformName} page`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </MasterAdminTableShell>
        )}
      </SectionPanel>
    );
  }
  if (section === 'external-config') {
    return (
      <MasterAdminGuidedPlaceholder description="External pipelines, school external posts, and category approvals for this school will be managed here." />
    );
  }
  if (section === 'raise-request') {
    const raiseUrl = `/master-admin/raise-request?schoolId=${encodeURIComponent(schoolId)}`;
    return (
      <SectionPanel>
        <p className="master-admin-detail-muted mb-3">
          View all shared queries for this school or raise a developer request (same flow as the Raise request sidebar
          page).
        </p>
        <Link to={raiseUrl} className="admin-btn-primary">
          Open Raise request
        </Link>
      </SectionPanel>
    );
  }
  return null;
}
