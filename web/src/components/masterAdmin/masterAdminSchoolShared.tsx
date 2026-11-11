import type { MasterAdminAdminRef } from '../../services/master-admin-schools.service';

export function AdminEmailList({ admins, emptyLabel }: { admins: MasterAdminAdminRef[]; emptyLabel: string }) {
  if (admins.length === 0) {
    return <p className="master-admin-detail-muted mb-0">{emptyLabel}</p>;
  }
  return (
    <ul className="list-unstyled mb-0 master-admin-detail-admin-list">
      {admins.map((admin) => (
        <li key={admin.id}>
          <span className="master-admin-detail-admin-name">{admin.name}</span>
          <a href={`mailto:${admin.email}`} className="master-admin-detail-admin-email">
            {admin.email}
          </a>
          {!admin.isActive ? <span className="master-admin-detail-badge-inactive">Inactive</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function OverviewAccordion({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="master-admin-overview-accordion">
      <summary className="master-admin-overview-accordion__summary">
        <span className="master-admin-overview-accordion__title">{title}</span>
        {meta ? <span className="master-admin-overview-accordion__meta">{meta}</span> : null}
        <i className="bi bi-chevron-down master-admin-overview-accordion__chevron" aria-hidden />
      </summary>
      <div className="master-admin-overview-accordion__body">{children}</div>
    </details>
  );
}
