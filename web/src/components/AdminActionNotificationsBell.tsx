import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../config/api';

export interface AdminActionItem {
  id: string;
  kind: string;
  title: string;
  summary: string;
  href: string;
  count: number;
  createdAt?: string;
}

export interface AdminActionItemsResponse {
  totalCount: number;
  items: AdminActionItem[];
}

export type AdminActionItemsRole =
  | 'school-admin'
  | 'category-admin'
  | 'subcategory-admin'
  | 'super-admin'
  | 'ads-admin';

export function fetchAdminActionItems(role: AdminActionItemsRole) {
  return api.get<AdminActionItemsResponse>(`/${role}/action-items`).then((r) => r.data);
}

const TEXT_DARK = '#1a1f2e';

export function AdminActionNotificationsBell({ role }: { role: AdminActionItemsRole }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-action-items', role],
    queryFn: () => fetchAdminActionItems(role),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const total = data?.totalCount ?? 0;
  const items = data?.items ?? [];

  return (
    <div className="position-relative" ref={rootRef}>
      <button
        type="button"
        className="btn d-flex align-items-center justify-content-center position-relative"
        aria-label={total > 0 ? `${total} pending actions` : 'No pending actions'}
        title="Pending actions"
        onClick={() => {
          setOpen((v) => !v);
          void refetch();
        }}
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          backgroundColor: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: TEXT_DARK,
          marginRight: '0.75rem',
        }}
      >
        <i className="bi bi-bell" style={{ fontSize: '1.1rem' }} aria-hidden />
        {total > 0 ? (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem', minWidth: 18 }}
          >
            {total > 99 ? '99+' : total}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="position-absolute end-0 shadow-lg border bg-white"
          style={{
            top: 'calc(100% + 8px)',
            width: 340,
            maxWidth: '90vw',
            borderRadius: 12,
            zIndex: 1100,
            overflow: 'hidden',
          }}
        >
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <span className="fw-semibold" style={{ color: TEXT_DARK, fontSize: '0.95rem' }}>
              Action needed
            </span>
            {isFetching ? <span className="small text-muted">Updating…</span> : null}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {isLoading ? (
              <div className="p-3 small text-muted">Loading…</div>
            ) : isError ? (
              <div className="p-3 small text-danger">Could not load notifications.</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-center">
                <i className="bi bi-check2-circle text-success" style={{ fontSize: '1.5rem' }} aria-hidden />
                <p className="small text-muted mb-0 mt-2">You&apos;re all caught up.</p>
              </div>
            ) : (
              <ul className="list-unstyled mb-0">
                {items.map((item) => (
                  <li key={item.id} className="border-bottom">
                    <Link
                      to={item.href}
                      className="d-block text-decoration-none px-3 py-3"
                      style={{ color: TEXT_DARK }}
                      onClick={() => setOpen(false)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="fw-semibold small">{item.title}</div>
                        <span className="badge rounded-pill" style={{ backgroundColor: TEXT_DARK }}>
                          {item.count}
                        </span>
                      </div>
                      <div className="small text-muted mt-1">{item.summary}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
