import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminEventsService } from '../services/subcategory-admin-events.service';

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

export function SubCategoryAdminApprovedPanel() {
  const [viewEventId, setViewEventId] = useState<string | null>(null);

  const { data: approvedEvents = [], isLoading, error } = useQuery({
    queryKey: ['subcategory-admin', 'events', 'approved'],
    queryFn: () => subcategoryAdminEventsService.getApproved(),
  });

  const selectedEvent = approvedEvents.find((event) => event.id === viewEventId) ?? null;

  return (
    <>
      <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '1.5rem' }}>
        Events approved by the category admin and live on the website for your school.
      </p>

      {!viewEventId && (
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
                <p style={{ color: '#6c757d', margin: 0 }}>Failed to load approved events</p>
              </div>
            ) : approvedEvents.length === 0 ? (
              <div className="text-center py-5">
                <i
                  className="bi bi-check-circle"
                  style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }}
                />
                <p style={{ color: '#6c757d', margin: 0 }}>No approved events yet</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Post title</th>
                      <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Subcategory</th>
                      <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Approved on</th>
                      <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Status</th>
                      <th style={{ fontWeight: '600', color: '#1a1f2e', width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedEvents.map((event) => (
                      <tr key={event.id}>
                        <td style={{ fontWeight: '500', color: '#1a1f2e' }}>{event.title}</td>
                        <td style={{ color: '#6c757d' }}>{event.subCategory?.name ?? '—'}</td>
                        <td style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                          {formatDate(event.updatedAt)}
                        </td>
                        <td>
                          <span className="badge bg-success" style={{ borderRadius: '4px' }}>
                            Live on website
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
                            onClick={() => setViewEventId(event.id)}
                            title="View details"
                            aria-label={`View details for ${event.title}`}
                          >
                            <i className="bi bi-eye" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {viewEventId && selectedEvent && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                Post details
              </h2>
              <button
                type="button"
                onClick={() => setViewEventId(null)}
                className="btn"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #dee2e6',
                  borderRadius: '50px',
                  padding: '0.5rem 1rem',
                  color: '#1a1f2e',
                  fontWeight: '500',
                }}
              >
                <i className="bi bi-arrow-left me-2" />
                Back to list
              </button>
            </div>

            <h3 style={{ fontSize: '1.25rem', color: '#1a1f2e', marginBottom: '1rem' }}>
              {selectedEvent.title}
            </h3>
            {selectedEvent.description && (
              <p style={{ color: '#1a1f2e', marginBottom: '1rem' }}>{selectedEvent.description}</p>
            )}
            {selectedEvent.externalLink && (
              <p className="mb-2">
                <strong>Link:</strong>{' '}
                <a href={selectedEvent.externalLink} target="_blank" rel="noopener noreferrer">
                  {selectedEvent.externalLink}
                </a>
              </p>
            )}
            <p className="mb-1">
              <strong>Subcategory:</strong> {selectedEvent.subCategory?.name ?? '—'}
            </p>
            <p className="mb-1">
              <strong>Approved on:</strong> {formatDate(selectedEvent.updatedAt)}
            </p>
            <p className="mb-2">
              <strong>Comments:</strong> {selectedEvent.commentsEnabled ? 'Enabled' : 'Disabled'}
            </p>
            {parseImageUrls(selectedEvent.imageUrls).length > 0 && (
              <div className="mb-3">
                <strong>Images:</strong>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {parseImageUrls(selectedEvent.imageUrls).map((url, i) => (
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
            <span className="badge bg-success" style={{ borderRadius: '4px' }}>
              Live on website
            </span>
          </div>
        </div>
      )}
    </>
  );
}
