import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import type { MasterAdminSchoolSectionId } from '../constants/masterAdminSchoolSections';

const SECTION_COPY: Record<
  Exclude<MasterAdminSchoolSectionId, 'overview'>,
  { title: string; blurb: string }
> = {
  posts: {
    title: 'Posts',
    blurb: 'Cross-school and per-school news/events posts. Open a school to manage its post table and live previews.',
  },
  social: {
    title: 'Social share',
    blurb: 'Social accounts and sharing configuration per school.',
  },
  users: {
    title: 'Users',
    blurb: 'Registered students and parents per school.',
  },
  categories: {
    title: 'Categories',
    blurb: 'Categories, subcategories, and admin assignments per school.',
  },
  'external-config': {
    title: 'External config',
    blurb: 'External pipelines, approvals, and school external posts.',
  },
  upcoming: {
    title: 'Upcoming news',
    blurb: 'Scheduled upcoming news items per school.',
  },
  analytics: {
    title: 'Analytics',
    blurb: 'Analytics feature enablement and usage per school.',
  },
  'raise-request': {
    title: 'Raise request',
    blurb: 'Escalations and requests between schools and platform admins.',
  },
  blogs: {
    title: 'Blogs',
    blurb: 'Blog posts and approval status per school.',
  },
};

export function MasterAdminMainSection({ sectionId }: { sectionId: Exclude<MasterAdminSchoolSectionId, 'overview'> }) {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const copy = SECTION_COPY[sectionId];

  return (
    <MasterAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">{copy.title}</h1>
        <p className="admin-page-subtitle">{copy.blurb}</p>
      </header>

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__body">
          <p className="master-admin-detail-muted mb-3">
            Choose a school to open this area with live data, tables, and previews.
          </p>
          <Link to="/master-admin/schools" className="admin-btn-primary">
            <i className="bi bi-buildings me-2" aria-hidden />
            Go to Schools
          </Link>
          <p className="admin-form-hint mt-3 mb-0">
            Cross-school tools for {copy.title.toLowerCase()} will be added on this page in a later step.
          </p>
        </div>
      </section>
    </MasterAdminLayout>
  );
}
