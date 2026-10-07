import { useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SchoolAdminLayout } from '../components/SchoolAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { SchoolAdminUserRequestsPanel } from './SchoolAdminUserRequests';
import { SchoolAdminApprovedUsersPanel } from './SchoolAdminApprovedUsers';
import { SchoolAdminAutomatedUsersPanel } from './SchoolAdminAutomatedUsers';
import { SchoolAdminTotalUsersPanel } from './SchoolAdminTotalUsers';
import { SchoolAdminUserHelpPanel } from './SchoolAdminUserHelp';

type UsersTab = 'requests' | 'approved' | 'automated' | 'total' | 'help';

const USER_TABS: { id: UsersTab; label: string }[] = [
  { id: 'requests', label: 'User requests' },
  { id: 'approved', label: 'Approved users' },
  { id: 'automated', label: 'Automated users' },
  { id: 'total', label: 'Total users' },
  { id: 'help', label: 'Users help' },
];

function parseUsersTab(raw: string | null): UsersTab {
  if (raw === 'approved' || raw === 'automated' || raw === 'total' || raw === 'help') return raw;
  return 'requests';
}

const TAB_SUBTITLES: Record<UsersTab, string> = {
  requests:
    'Students who registered with Gmail/Yahoo and uploaded a school doc. View, approve, ask to reupload, or reject.',
  approved: 'Students approved by you after Gmail signup. Ban to revoke login; unban to restore.',
  automated: 'Students who signed up with a school-domain email and verified via OTP.',
  total: 'Students and admins in your school. Ban an admin to revoke their admin access.',
  help: 'Queries raised by app users from your school. They appear in the Help tab in the app.',
};

export const SchoolAdminUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => parseUsersTab(searchParams.get('tab')), [searchParams]);
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.school } as CSSProperties;

  const setTab = (tab: UsersTab) => {
    if (tab === 'requests') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  return (
    <SchoolAdminLayout>
      <div className="admin-users-page">
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">Users</h1>
        <p className="admin-page-subtitle">{TAB_SUBTITLES[activeTab]}</p>

        <nav className="admin-dashboard-badges" aria-label="User management sections">
          {USER_TABS.map(({ id, label }) => (
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

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__body admin-panel__body--flush-top">
          {activeTab === 'requests' ? <SchoolAdminUserRequestsPanel /> : null}
          {activeTab === 'approved' ? <SchoolAdminApprovedUsersPanel /> : null}
          {activeTab === 'automated' ? <SchoolAdminAutomatedUsersPanel /> : null}
          {activeTab === 'total' ? <SchoolAdminTotalUsersPanel /> : null}
          {activeTab === 'help' ? <SchoolAdminUserHelpPanel /> : null}
        </div>
      </section>
      </div>
    </SchoolAdminLayout>
  );
};
