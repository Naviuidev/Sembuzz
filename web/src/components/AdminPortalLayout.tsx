import { useEffect, type ReactNode } from 'react';

/** Shared dashboard chrome: light navbar + accent sidebar + scrollable main. */
export function AdminPortalLayout({
  navbar,
  sidebar,
  children,
}: {
  navbar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.classList.add('admin-portal-document');
    return () => document.documentElement.classList.remove('admin-portal-document');
  }, []);

  return (
    <div className="admin-shell" style={{ backgroundColor: '#f8fafc' }}>
      {navbar}
      <div className="admin-shell-body">
        {sidebar}
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
