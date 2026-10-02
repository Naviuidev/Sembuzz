import { useMemo, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { schoolsService } from '../services/schools.service';
import type { School } from '../services/schools.service';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { EditSchoolPanel } from './EditSchool';
import { SchoolInfoPanel } from './SchoolInfo';

type DashboardTab = 'dashboard' | 'edit' | 'info';

const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'edit', label: 'Edit school' },
  { id: 'info', label: 'School info' },
];

function parseDashboardTab(raw: string | null): DashboardTab {
  if (raw === 'edit' || raw === 'info') return raw;
  return 'dashboard';
}

function SuperAdminSchoolsListPanel() {
  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ['schools'],
    queryFn: schoolsService.getAll,
  });

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  return (
    <section className="admin-panel" style={panelStyle}>
      <div className="admin-panel__header">
        <h2 className="admin-panel__title">Schools</h2>
        <Link to="/super-admin/schools/new" className="admin-btn-primary">
          + Create School
        </Link>
      </div>

      <div className="admin-panel__body admin-panel__body--flush-top">
        {isLoading ? (
          <div className="admin-loading-state">
            <div className="spinner-border spinner-border-sm text-secondary me-2" role="status" />
            Loading schools…
          </div>
        ) : schools && schools.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Ref Number</th>
                  <th scope="col">School Name</th>
                  <th scope="col">City</th>
                  <th scope="col">Features</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school.id}>
                    <td className="admin-table__mono">{school.refNum}</td>
                    <td className="admin-table__strong">{school.name}</td>
                    <td>{school.city}</td>
                    <td>
                      <div className="admin-pill-row">
                        {school.enabledFeatures.slice(0, 3).map((f) => (
                          <span key={f.code} className="admin-pill admin-pill--feature">
                            {f.name}
                          </span>
                        ))}
                        {school.enabledFeatures.length > 3 ? (
                          <span className="admin-pill admin-pill--more">+{school.enabledFeatures.length - 3}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`admin-pill ${school.isActive ? 'admin-pill--active' : 'admin-pill--inactive'}`}
                      >
                        {school.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/super-admin/schools/${school.id}`} className="admin-table__link">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <p>No schools found.</p>
            <Link to="/super-admin/schools/new" className="admin-btn-primary">
              Create your first school
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => parseDashboardTab(searchParams.get('tab')), [searchParams]);

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  const setTab = (tab: DashboardTab) => {
    if (tab === 'dashboard') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const tabSubtitle =
    activeTab === 'edit'
      ? 'Search and select a school to edit details, features, and admin email.'
      : activeTab === 'info'
        ? 'Select a school to email reference info, features, or tenure reminders to the School Admin.'
        : 'Manage your schools and view important information';

  return (
    <SuperAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">Welcome back, {user?.name ?? 'Super Admin'}</h1>
        <p className="admin-page-subtitle">{tabSubtitle}</p>

        <nav className="admin-dashboard-badges" aria-label="School management sections">
          {DASHBOARD_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`admin-dashboard-badge${activeTab === id ? ' is-active' : ''}`}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'dashboard' ? <SuperAdminSchoolsListPanel /> : null}
      {activeTab === 'edit' ? <EditSchoolPanel onCancel={() => setTab('dashboard')} /> : null}
      {activeTab === 'info' ? <SchoolInfoPanel /> : null}
    </SuperAdminLayout>
  );
};
