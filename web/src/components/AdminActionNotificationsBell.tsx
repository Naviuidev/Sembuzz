import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  adminActionItemsQueryKey,
  fetchAdminActionItems,
  type AdminActionItemsRole,
} from '../services/admin-action-items.service';

const TEXT_DARK = '#1a1f2e';

export type { AdminActionItem, AdminActionItemsResponse, AdminActionItemsRole } from '../services/admin-action-items.service';

export function AdminActionNotificationsBell({ role }: { role: AdminActionItemsRole }) {
  const [open, setOpen] = useState(false);
  const [justCleared, setJustCleared] = useState(false);
  const [justResolved, setJustResolved] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const prevTotalRef = useRef<number | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: adminActionItemsQueryKey(role),
    queryFn: () => fetchAdminActionItems(role),
    refetchInterval: 60_000,
    staleTime: 15_000,
  });

  const total = data?.totalCount ?? 0;
  const items = data?.items ?? [];

  useEffect(() => {
    const prev = prevTotalRef.current;
    if (prev != null && prev > total) {
      if (total === 0) {
        setJustCleared(true);
        setJustResolved(false);
        const t = setTimeout(() => setJustCleared(false), 2500);
        prevTotalRef.current = total;
        return () => clearTimeout(t);
      }
      setJustResolved(true);
      setJustCleared(false);
      const t = setTimeout(() => setJustResolved(false), 1800);
      prevTotalRef.current = total;
      return () => clearTimeout(t);
    }
    prevTotalRef.current = total;
    if (total > 0) {
      setJustCleared(false);
      setJustResolved(false);
    }
  }, [total]);

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
            className={`position-absolute top-0 start-100 translate-middle badge rounded-pill d-flex align-items-center justify-content-center${
              justResolved ? '' : ' bg-danger'
            }`}
            style={{
              fontSize: '0.65rem',
              minWidth: 18,
              backgroundColor: justResolved ? '#198754' : undefined,
              transition: 'background-color 0.25s ease',
            }}
            title={justResolved ? 'Action completed' : undefined}
          >
            {justResolved ? <i className="bi bi-check-lg" aria-hidden /> : total > 99 ? '99+' : total}
          </span>
        ) : justCleared ? (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success d-flex align-items-center justify-content-center"
            style={{ fontSize: '0.65rem', width: 18, height: 18, padding: 0 }}
            title="All caught up"
          >
            <i className="bi bi-check-lg" aria-hidden />
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
