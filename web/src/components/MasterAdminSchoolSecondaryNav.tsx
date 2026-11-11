import type { CSSProperties } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  masterAdminSchoolSectionPath,
  type MasterAdminSchoolSectionDef,
} from '../constants/masterAdminSchoolSections';

export function MasterAdminSchoolSecondaryNav({
  sections,
  schoolName,
}: {
  sections: MasterAdminSchoolSectionDef[];
  schoolName?: string;
}) {
  const { schoolId, section: sectionParam } = useParams<{ schoolId: string; section?: string }>();
  const style = { '--sidebar-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;

  if (!schoolId) return null;

  return (
    <aside className="master-admin-school-secondary" style={style} aria-label="School sections">
      {schoolName ? (
        <p className="master-admin-school-secondary__school" title={schoolName}>
          {schoolName}
        </p>
      ) : null}
      <nav>
        <ul className="master-admin-school-secondary__list list-unstyled mb-0">
          {sections.map((section) => {
            const path = masterAdminSchoolSectionPath(schoolId, section.id);
            const isOverview = section.id === 'overview';
            const isActive = isOverview ? !sectionParam : sectionParam === section.id;
            return (
              <li key={section.id}>
                <NavLink
                  to={path}
                  className={`master-admin-school-secondary__link${isActive ? ' is-active' : ''}`}
                  end={isOverview}
                >
                  <i className={`bi ${section.icon}`} aria-hidden />
                  {section.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
