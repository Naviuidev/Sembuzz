import { useMemo, useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  MasterAdminApprovedUsersPanel,
  MasterAdminAutomatedUsersPanel,
  MasterAdminUserHelpPanel,
  MasterAdminUserRequestsPanel,
} from '../components/masterAdmin/MasterAdminUsersTabPanels';
import { masterAdminSchoolsService } from '../services/master-admin-schools.service';

type UsersTab = 'requests' | 'approved' | 'automated' | 'help';

const USER_TABS: { id: UsersTab; label: string }[] = [
  { id: 'requests', label: 'User requests' },
  { id: 'approved', label: 'Approved users' },
  { id: 'automated', label: 'Automated users' },
  { id: 'help', label: 'Users help' },
];

const TAB_SUBTITLES: Record<UsersTab, string> = {
  requests: 'Pending Gmail/Yahoo signups with uploaded school documents (view-only for master admin).',
  approved: 'Students approved after Gmail signup. Ban or unban login access.',
  automated: 'Students who signed up with a school-domain email and verified via OTP.',
  help: 'Queries raised by app users from the selected school.',
};

export function MasterAdminUsersPage() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [activeTab, setActiveTab] = useState<UsersTab>('requests');

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);
  const selectedSchool = schoolOptions.find((s) => s.id === selectedSchoolId);

  return (
    <MasterAdminLayout>
      <div className="admin-posts-page master-admin-posts-hub admin-users-page">
        <header className="admin-page-header master-admin-posts-page__header" style={panelStyle}>
          <div className="master-admin-posts-page__header-row">
            <div>
              <h1 className="admin-page-title mb-1">Users</h1>
              <p className="admin-page-subtitle mb-0">
                {selectedSchoolId ? TAB_SUBTITLES[activeTab] : 'Select a school to manage user requests, approvals, and help.'}
              </p>
            </div>
          </div>
        </header>

        <section className="admin-panel master-admin-posts-school-filter" style={panelStyle}>
          <div className="admin-panel__body">
            <label className="admin-form-label" htmlFor="ma-users-filter-school">
              Select school
            </label>
            <select
              id="ma-users-filter-school"
              className="form-select admin-form-control master-admin-posts-school-filter__select"
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setActiveTab('requests');
              }}
              disabled={schoolsLoading}
            >
              <option value="">Choose school…</option>
              {schoolOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {selectedSchoolId ? (
              <>
                <label className="admin-form-label mt-3" htmlFor="ma-users-filter-section">
                  Section
                </label>
                <select
                  id="ma-users-filter-section"
                  className="form-select admin-form-control master-admin-posts-school-filter__select"
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as UsersTab)}
                >
                  {USER_TABS.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            {selectedSchool ? (
              <p className="admin-form-hint mb-0 mt-2">
                Viewing: <strong>{selectedSchool.name}</strong>
              </p>
            ) : null}
          </div>
        </section>

        {selectedSchoolId ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body admin-panel__body--flush-top">
              {activeTab === 'requests' ? <MasterAdminUserRequestsPanel schoolId={selectedSchoolId} /> : null}
              {activeTab === 'approved' ? <MasterAdminApprovedUsersPanel schoolId={selectedSchoolId} /> : null}
              {activeTab === 'automated' ? <MasterAdminAutomatedUsersPanel schoolId={selectedSchoolId} /> : null}
              {activeTab === 'help' ? <MasterAdminUserHelpPanel schoolId={selectedSchoolId} /> : null}
            </div>
          </section>
        ) : (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <p className="master-admin-detail-muted mb-0">Choose a school above to view users.</p>
            </div>
          </section>
        )}
      </div>
    </MasterAdminLayout>
  );
}
