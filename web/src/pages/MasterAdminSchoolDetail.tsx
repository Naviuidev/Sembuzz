import type { CSSProperties } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MasterAdminSchoolSectionContent } from '../components/masterAdmin/MasterAdminSchoolSectionViews';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { MasterAdminSchoolSecondaryNav } from '../components/MasterAdminSchoolSecondaryNav';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  getMasterAdminSectionsForSchool,
  isMasterAdminSchoolSectionId,
  type MasterAdminSchoolSectionDef,
  type MasterAdminSchoolSectionId,
} from '../constants/masterAdminSchoolSections';
import { masterAdminSchoolsService } from '../services/master-admin-schools.service';

const OVERVIEW_SECTION: MasterAdminSchoolSectionDef = {
  id: 'overview',
  label: 'Overview',
  icon: 'bi-grid-1x2',
  always: true,
};

const SECTION_LABELS: Record<MasterAdminSchoolSectionId, string> = {
  overview: 'Overview',
  posts: 'Posts',
  social: 'Social share',
  users: 'Users',
  categories: 'Categories',
  'external-config': 'External config',
  upcoming: 'Upcoming news',
  analytics: 'Analytics',
  'raise-request': 'Raise request',
  blogs: 'Blogs',
};

function SectionPageTitle({ section, schoolName }: { section: MasterAdminSchoolSectionId; schoolName: string }) {
  if (section === 'overview') return null;
  return <h2 className="master-admin-section-title">{SECTION_LABELS[section] ?? schoolName}</h2>;
}

export const MasterAdminSchoolDetail = () => {
  const { schoolId, section: sectionParam } = useParams<{ schoolId: string; section?: string }>();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;

  const activeSection: MasterAdminSchoolSectionId =
    sectionParam && isMasterAdminSchoolSectionId(sectionParam) ? sectionParam : 'overview';

  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools', schoolId, 'overview'],
    queryFn: () => masterAdminSchoolsService.getOverview(schoolId!),
    enabled: Boolean(schoolId),
  });

  if (!schoolId) {
    return <Navigate to="/master-admin/schools" replace />;
  }

  if (sectionParam && !isMasterAdminSchoolSectionId(sectionParam)) {
    return <Navigate to={`/master-admin/schools/${schoolId}`} replace />;
  }

  const enabledCodes = overview?.enabledFeatures.map((f) => f.code) ?? [];
  const featureSections = overview ? getMasterAdminSectionsForSchool(enabledCodes) : [];
  const sections: MasterAdminSchoolSectionDef[] = [OVERVIEW_SECTION, ...featureSections];

  if (overview && activeSection !== 'overview' && !sections.some((s) => s.id === activeSection)) {
    return <Navigate to={`/master-admin/schools/${schoolId}`} replace />;
  }

  return (
    <MasterAdminLayout>
      <div className="master-admin-school-detail-page" style={panelStyle}>
        <MasterAdminSchoolSecondaryNav sections={sections} schoolName={overview?.school.name} />
        <div className="master-admin-school-content">
          <div className="master-admin-school-content-toolbar">
            <Link to="/master-admin/schools" className="admin-btn-secondary">
              <i className="bi bi-arrow-left me-2" aria-hidden />
              Back to all schools
            </Link>
          </div>
          {isLoading ? (
            <p className="master-admin-detail-muted">Loading school…</p>
          ) : isError || !overview ? (
            <p className="master-admin-detail-muted">Could not load this school.</p>
          ) : (
            <>
              <SectionPageTitle section={activeSection} schoolName={overview.school.name} />
              <MasterAdminSchoolSectionContent section={activeSection} overview={overview} schoolId={schoolId} />
            </>
          )}
        </div>
      </div>
    </MasterAdminLayout>
  );
};
