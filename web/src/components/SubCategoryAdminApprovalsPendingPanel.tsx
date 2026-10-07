import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminEventsService, type PendingEvent } from '../services/subcategory-admin-events.service';
import { EventPostReviewSummary } from './EventPostReviewSummary';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

export function SubCategoryAdminApprovalsPendingPanel() {
  const [viewEventId, setViewEventId] = useState<string | null>(null);

  const { data: pendingApprovals = [], isLoading, error } = useQuery({
    queryKey: ['subcategory-admin', 'events', 'pending'],
    queryFn: () => subcategoryAdminEventsService.getPending(),
  });

  const renderExpandedRow = (row: PendingEvent) => {
    const images = parseImageUrls(row.imageUrls);
    return (
      <tr className="admin-table__expand-row">
        <td colSpan={5}>
          <div className="admin-table__details p-3">
            <h3 className="admin-panel__title mb-2" style={{ fontSize: '0.9375rem' }}>
              Post details
            </h3>
            {row.description ? <p className="mb-2">{row.description}</p> : null}
            <EventPostReviewSummary event={row} className="mb-2" />
            <p className="admin-form-hint mb-1">
              <strong>Subcategory:</strong> {row.subCategory?.name ?? '—'}
            </p>
            <p className="admin-form-hint mb-1">
              <strong>Submitted:</strong> {formatDate(row.createdAt)}
            </p>
            <p className="admin-form-hint mb-2">
              <strong>Comments:</strong> {row.commentsEnabled ? 'Enabled' : 'Disabled'}
            </p>
            {images.length > 0 ? (
              <div className="d-flex flex-wrap gap-2 mb-2">
                {images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt=""
                      style={{ maxHeight: 72, maxWidth: 120, objectFit: 'cover', borderRadius: 8 }}
                    />
                  </a>
                ))}
              </div>
            ) : null}
            <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => setViewEventId(null)}>
              Close
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (isLoading) {
    return <div className="admin-loading-state">Loading pending posts…</div>;
  }
  if (error) {
    return <div className="admin-empty-state"><p>Failed to load pending approvals.</p></div>;
  }
  if (pendingApprovals.length === 0) {
    return (
      <div className="admin-empty-state">
        <i className="bi bi-clock-history admin-category-dashboard__empty-icon" aria-hidden />
        <p className="admin-form-hint mb-0">No pending approvals at the moment.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Post title</th>
            <th scope="col">Subcategory</th>
            <th scope="col">Submitted</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(pendingApprovals as PendingEvent[]).map((row) => (
            <Fragment key={row.id}>
              <tr>
                <td className="admin-table__strong">{row.title}</td>
                <td>{row.subCategory?.name ?? '—'}</td>
                <td>{formatDate(row.createdAt)}</td>
                <td>
                  <span className="admin-pill admin-pill--status-pending">Pending</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-icon-btn admin-icon-btn--edit"
                    title={viewEventId === row.id ? 'Hide details' : 'View details'}
                    aria-label={`View details for ${row.title}`}
                    onClick={() => setViewEventId((id) => (id === row.id ? null : row.id))}
                  >
                    <i className="bi bi-eye" aria-hidden />
                  </button>
                </td>
              </tr>
              {viewEventId === row.id ? renderExpandedRow(row) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
