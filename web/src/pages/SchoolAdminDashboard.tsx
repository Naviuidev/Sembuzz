import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SchoolAdminLayout } from '../components/SchoolAdminLayout';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { schoolAdminStudentsService } from '../services/school-admin-students.service';
import { schoolAdminPendingUsersService } from '../services/school-admin-pending-users.service';

const QUICK_LINKS = [
  {
    to: '/school-admin/users',
    icon: 'bi-person-plus',
    title: 'User requests',
    meta: (pending: number | undefined) =>
      pending === undefined ? 'Loading…' : `${pending} pending · Approve or deny signups`,
  },
  {
    to: '/school-admin/users?tab=approved',
    icon: 'bi-person-check',
    title: 'Approved users',
    meta: (approved: number | undefined) =>
      approved === undefined ? 'Loading…' : `${approved} user${approved === 1 ? '' : 's'} · View & manage`,
  },
  {
    to: '/school-admin/analytics',
    icon: 'bi-graph-up-arrow',
    title: 'Analytics',
    meta: () => 'Post views, engagement, and trends',
  },
  {
    to: '/school-admin/posts',
    icon: 'bi-plus-circle',
    title: 'Create post',
    meta: () => 'Publish content for your school',
  },
] as const;

export const SchoolAdminDashboard = () => {
  const { user } = useSchoolAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.school } as CSSProperties;

  const { data: approvedUsers, isLoading: approvedLoading } = useQuery({
    queryKey: ['school-admin', 'students', 'approved'],
    queryFn: () => schoolAdminStudentsService.getApproved(),
  });

  const { data: pendingUsers, isLoading: pendingLoading } = useQuery({
    queryKey: ['school-admin', 'pending-users'],
    queryFn: () => schoolAdminPendingUsersService.getPendingUsers(),
  });

  const approvedCount = approvedLoading ? undefined : (approvedUsers?.length ?? 0);
  const pendingCount = pendingLoading ? undefined : (pendingUsers?.length ?? 0);

  const metaForLink = (index: number) => {
    if (index === 0) return QUICK_LINKS[0].meta(pendingCount);
    if (index === 1) return QUICK_LINKS[1].meta(approvedCount);
    return QUICK_LINKS[index].meta(undefined);
  };

  return (
    <SchoolAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">Welcome back, {user?.name ?? 'School Admin'}</h1>
        <p className="admin-page-subtitle">View your school profile and jump to common tasks.</p>
      </header>

      <div className="admin-dashboard-columns">
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">School details</h2>
            {user?.schoolDomain ? (
              <span className="admin-pill admin-pill--neutral">{user.schoolDomain}</span>
            ) : null}
          </div>
          <div className="admin-panel__body">
            <div className="admin-detail-grid">
              <div>
                <span className="admin-detail-label">School name</span>
                <p className="admin-detail-value mb-0">{user?.schoolName ?? '—'}</p>
              </div>
              <div>
                <span className="admin-detail-label">Reference number</span>
                <p className="admin-detail-value admin-detail-value--mono mb-0">{user?.refNum ?? '—'}</p>
              </div>
              <div>
                <span className="admin-detail-label">Admin name</span>
                <p className="admin-detail-value mb-0">{user?.name ?? '—'}</p>
              </div>
              <div>
                <span className="admin-detail-label">Admin email</span>
                <p className="admin-detail-value mb-0">{user?.email ?? '—'}</p>
              </div>
              <div className="admin-detail-grid--full">
                <span className="admin-detail-label">Enabled features</span>
                {user?.features && user.features.length > 0 ? (
                  <div className="admin-pill-row">
                    {user.features.map((feature) => (
                      <span key={feature.code} className="admin-pill admin-pill--feature">
                        {feature.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="admin-form-hint mb-0">No features enabled for this school.</p>
                )}
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
    </SchoolAdminLayout>
  );
};
