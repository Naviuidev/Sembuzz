import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { subcategoryAdminEventsService, type RevertedEvent } from '../services/subcategory-admin-events.service';

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

export const SubCategoryAdminReceivedCorrections = () => {
  const navigate = useNavigate();
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

  const handleMakeCorrections = (event: RevertedEvent) => {
    navigate('/subcategory-admin/post-event', { state: { resubmitEvent: event } });
  };

  return (
    <SubCategoryAdminLayout>
      <div className="mb-4">
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'normal',
          color: '#1a1f2e',
          marginBottom: '0.5rem'
        }}>
          Received corrections
        </h1>
        <p style={{
          color: '#6c757d',
          fontSize: '1rem',
          marginBottom: 0
        }}>
          Feedback from the category admin. Click a post to see details and make corrections, then resubmit.
        </p>
      </div>

      {/* Search bar - same style as Edit School */}
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
              fontSize: '1.1rem'
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
              border: '1px solid #dee2e6'
            }}
          />
        </div>
      </div>

      {/* List view: cards with title + sent back date */}
      {!selectedEventId && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
          <div className="card-body p-4">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" role="status" />
                <p className="mt-2 mb-0" style={{ color: '#6c757d' }}>Loading…</p>
              </div>
            ) : error ? (
              <div className="text-center py-5">
                <i className="bi bi-exclamation-circle" style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }} />
                <p style={{ color: '#6c757d', margin: 0 }}>Failed to load corrections</p>
              </div>
            ) : withCorrections.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-arrow-down-circle" style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }} />
                <p style={{ color: '#6c757d', margin: 0 }}>No corrections received</p>
                <p className="small text-muted mt-2 mb-0">When the category admin sends back a post with notes, they will appear here.</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-5">
                <p style={{ color: '#6c757d' }}>No posts match your search.</p>
              </div>
            ) : (
              <div className="row g-3 justify-content-center">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="col-md-3 col-sm-6">
                    <div
                      onClick={() => setSelectedEventId(event.id)}
                      style={{
                        border: '1px solid rgb(26, 31, 46)',
                        borderRadius: '4px',
                        padding: '1.5rem',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: '0.3s',
                        minHeight: '100px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        color: '#1a1f2e'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 2%)';
                      }}
                    >
                      <span style={{ color: '#1a1f2e', fontWeight: '500', fontSize: '1rem', marginBottom: '0.5rem' }}>
                        {event.title}
                      </span>
                      <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                        Sent back {formatDate(event.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail view: post details + category admin notes + Make corrections & resubmit */}
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
                  fontWeight: '500'
                }}
              >
                <i className="bi bi-arrow-left me-2" />
                Back to list
              </button>
            </div>

            <div className="mb-4">
              <h3 style={{ fontSize: '1.25rem', color: '#1a1f2e', marginBottom: '1rem' }}>{selectedEvent.title}</h3>
              {selectedEvent.description && (
                <p style={{ color: '#1a1f2e', marginBottom: '1rem' }}>{selectedEvent.description}</p>
              )}
              {selectedEvent.externalLink && (
                <p className="mb-2">
                  <strong>Link:</strong>{' '}
                  <a href={selectedEvent.externalLink} target="_blank" rel="noopener noreferrer">{selectedEvent.externalLink}</a>
                </p>
              )}
              <p className="mb-1"><strong>Subcategory:</strong> {selectedEvent.subCategory?.name ?? '—'}</p>
              <p className="mb-1"><strong>Sent back:</strong> {formatDate(selectedEvent.updatedAt)}</p>
              <p className="mb-2"><strong>Comments:</strong> {selectedEvent.commentsEnabled ? 'Enabled' : 'Disabled'}</p>
              {parseImageUrls(selectedEvent.imageUrls).length > 0 && (
                <div className="mb-3">
                  <strong>Images:</strong>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {parseImageUrls(selectedEvent.imageUrls).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="" style={{ maxHeight: '80px', maxWidth: '120px', objectFit: 'cover', border: '1px solid #dee2e6' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '0px',
                borderLeft: '3px solid #ffc107',
                marginBottom: '1.5rem'
              }}>
                <p className="small text-muted mb-1" style={{ fontWeight: '600' }}>Category admin notes:</p>
                <p style={{ color: '#1a1f2e', margin: 0, whiteSpace: 'pre-wrap' }}>{selectedEvent.revertNotes}</p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ borderRadius: '50px', padding: '0.5rem 1.5rem', fontWeight: '500' }}
                onClick={() => handleMakeCorrections(selectedEvent)}
              >
                Make corrections & resubmit
              </button>
            </div>
          </div>
        </div>
      )}
    </SubCategoryAdminLayout>
  );
};
