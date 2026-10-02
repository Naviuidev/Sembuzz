import type { CSSProperties, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

export type AdminSidebarItem = {
  path: string;
  label: string;
  icon: string;
  title?: string;
  iconNode?: ReactNode;
};

export function AdminSidebarNav({
  accent,
  items,
  secondaryItems,
  matchActive = 'exact',
}: {
  accent: string;
  items: AdminSidebarItem[];
  secondaryItems?: AdminSidebarItem[];
  matchActive?: 'exact' | 'prefix';
}) {
  const location = useLocation();

  const isActive = (path: string) =>
    matchActive === 'prefix'
      ? location.pathname === path || location.pathname.startsWith(`${path}/`)
      : location.pathname === path;

  const style = { '--sidebar-accent': accent } as CSSProperties;

  const renderItem = (item: AdminSidebarItem) => {
    const active = isActive(item.path);
    return (
      <li key={item.path} className="admin-sidebar-item">
        <Link
          to={item.path}
          title={item.title ?? item.label}
          className={`admin-sidebar-link d-flex align-items-center${active ? ' is-active' : ''}`}
        >
          <span className="admin-sidebar-icon" aria-hidden>
            {item.iconNode ?? <i className={`bi ${item.icon}`} />}
          </span>
          <span className="admin-sidebar-label">{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="admin-sidebar admin-sidebar--portal" style={style}>
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        <ul className="list-unstyled mb-0 admin-sidebar-list">{items.map(renderItem)}</ul>
        {secondaryItems?.length ? (
          <>
            <div className="admin-sidebar-divider" />
            <ul className="list-unstyled mb-0 admin-sidebar-list">{secondaryItems.map(renderItem)}</ul>
          </>
        ) : null}
      </nav>
    </div>
  );
}
