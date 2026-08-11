import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  subcategoryAdminEventsService,
  type RevertedEvent,
} from '../services/subcategory-admin-events.service';

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

type SubCategoryAdminReceivedCorrectionsPanelProps = {
  onMakeCorrections: (event: RevertedEvent) => void;
};

export function SubCategoryAdminReceivedCorrectionsPanel({
  onMakeCorrections,
}: SubCategoryAdminReceivedCorrectionsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['subcategory-admin', 'events', 'reverted'],
    queryFn: () => subcategoryAdminEventsService.getReverted(),
  });

  const withCorrections = (events as RevertedEvent[]).filter(
    (e) => e.revertNotes && e.revertNotes.trim().length > 0,
  );

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return withCorrections;
    const q = searchQuery.toLowerCase();
    return withCorrections.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.subCategory?.name ?? '').toLowerCase().includes(q),
    );
  }, [withCorrections, searchQuery]);

  const selectedEvent = useMemo(
    () => withCorrections.find((e) => e.id === selectedEventId) ?? null,
    [withCorrections, selectedEventId],
  );

  return (
    <>
      <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '1.5rem' }}>
        Feedback from the category admin. Open a post to see notes, make corrections, then resubmit
        for approval.
      </p>

      <div className="mb-4" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
        <div style={{ position: 'relative' }}>
          <i
            className="bi bi-search"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6c757d',
              fontSize: '1.1rem',
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search received corrections"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              borderRadius: '50px',
              padding: '0.75rem 1rem 0.75rem 3rem',
              fontSize: '1rem',
              border: '1px solid #dee2e6',
            }}
          />
        </div>
      </div>

      {!selectedEventId && (
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
                <p style={{ color: '#6c757d', margin: 0 }}>Failed to load corrections</p>
              </div>
            ) : withCorrections.length === 0 ? (
              <div className="text-center py-5">
                <i
                  className="bi bi-arrow-down-circle"
                  style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }}
                />
                <p style={{ color: '#6c757d', margin: 0 }}>No corrections received</p>
                <p className="small text-muted mt-2 mb-0">
                  When the category admin sends back a post with notes, they will appear here.
                </p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-5">
                <p style={{ color: '#6c757d' }}>No posts match your search.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Post title</th>
                      <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Subcategory</th>
                      <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Sent back</th>
                      <th style={{ fontWeight: '600', color: '#1a1f2e', width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id}>
                        <td style={{ fontWeight: '500', color: '#1a1f2e' }}>{event.title}</td>
                        <td style={{ color: '#6c757d' }}>{event.subCategory?.name ?? '—'}</td>
                        <td style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                          {formatDate(event.updatedAt)}
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
                            onClick={() => setSelectedEventId(event.id)}
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

      {selectedEventId && selectedEvent && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                Post details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedEventId('')}
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

            <div className="mb-4">
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
                <strong>Sent back:</strong> {formatDate(selectedEvent.updatedAt)}
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

              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '0px',
                  borderLeft: '3px solid #ffc107',
                  marginBottom: '1.5rem',
                }}
              >
                <p className="small text-muted mb-1" style={{ fontWeight: '600' }}>
                  Category admin notes:
                </p>
                <p style={{ color: '#1a1f2e', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedEvent.revertNotes}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ borderRadius: '50px', padding: '0.5rem 1.5rem', fontWeight: '500' }}
                onClick={() => onMakeCorrections(selectedEvent)}
              >
                Make corrections & resubmit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
