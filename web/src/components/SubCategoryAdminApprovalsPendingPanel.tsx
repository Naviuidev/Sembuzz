import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminEventsService, type PendingEvent } from '../services/subcategory-admin-events.service';

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

  const renderDetailRow = (row: PendingEvent) => {
    const images = parseImageUrls(row.imageUrls);
    return (
      <tr key={`${row.id}-detail`} style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <td colSpan={5} style={{ padding: '1rem 1rem 1.5rem', verticalAlign: 'top' }}>
          <div>
            <h6 style={{ color: '#1a1f2e', marginBottom: '0.75rem', fontWeight: '600' }}>
              Current post details (including any edits by category admin)
            </h6>
            {row.description && (
              <p style={{ marginBottom: '0.75rem', color: '#1a1f2e' }}>{row.description}</p>
            )}
            {row.externalLink && (
              <p className="mb-1">
                <strong>Link:</strong>{' '}
                <a href={row.externalLink} target="_blank" rel="noopener noreferrer">
                  {row.externalLink}
                </a>
              </p>
            )}
            <p className="mb-1">
              <strong>Subcategory:</strong> {row.subCategory?.name ?? '—'}
            </p>
            <p className="mb-1">
              <strong>Submitted:</strong> {formatDate(row.createdAt)}
            </p>
            <p className="mb-2">
              <strong>Comments:</strong> {row.commentsEnabled ? 'Enabled' : 'Disabled'}
            </p>
            {images.length > 0 && (
              <div className="mb-2">
                <strong>Images:</strong>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {images.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt=""
                        style={{
                          maxHeight: '80px',
                          maxWidth: '120px',
                          objectFit: 'cover',
                          border: '1px solid #dee2e6',
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              style={{ borderRadius: '0px' }}
              onClick={() => setViewEventId(null)}
            >
              Close
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <>
      <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '1.5rem' }}>
        Events sent for approval. Use the eye icon to see current details (including any edits by
        the category admin).
      </p>

      <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
        <div className="card-body p-4">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" role="status" />
              <p className="mt-2 mb-0" style={{ color: '#6c757d' }}>
                Loading…
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <i
                className="bi bi-exclamation-circle"
                style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }}
              />
              <p style={{ color: '#6c757d', margin: 0 }}>Failed to load pending approvals</p>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-clock-history"
                style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }}
              />
              <p style={{ color: '#6c757d', margin: 0 }}>No pending approvals at the moment</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Post title</th>
                    <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Subcategory</th>
                    <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Submitted</th>
                    <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Status</th>
                    <th style={{ fontWeight: '600', color: '#1a1f2e', width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(pendingApprovals as PendingEvent[]).map((row) => (
                    <React.Fragment key={row.id}>
                      <tr>
                        <td style={{ fontWeight: '500', color: '#1a1f2e' }}>{row.title}</td>
                        <td style={{ color: '#6c757d' }}>{row.subCategory?.name ?? '—'}</td>
                        <td style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                          {formatDate(row.createdAt)}
                        </td>
                        <td>
                          <span className="badge bg-warning text-dark" style={{ borderRadius: '4px' }}>
                            Pending
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '50px',
                              padding: '0.35rem 0.75rem',
                              color: '#1a1f2e',
                              fontWeight: '500',
                            }}
                            onClick={() => setViewEventId((id) => (id === row.id ? null : row.id))}
                            title={viewEventId === row.id ? 'Hide details' : 'View details'}
                            aria-label={`View details for ${row.title}`}
                          >
                            <i className="bi bi-eye" />
                          </button>
                        </td>
                      </tr>
                      {viewEventId === row.id && renderDetailRow(row)}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
