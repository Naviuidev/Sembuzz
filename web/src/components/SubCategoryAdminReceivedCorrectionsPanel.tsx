import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  subcategoryAdminEventsService,
  type RevertedEvent,
} from '../services/subcategory-admin-events.service';
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
      <div className="admin-search-wrap admin-search-wrap--wide mb-4">
        <i className="bi bi-search admin-search-icon" aria-hidden />
        <input
          type="search"
          className="form-control admin-search-input"
          placeholder="Search corrections by title or subcategory…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="admin-loading-state">Loading corrections…</div>
      ) : error ? (
        <div className="admin-empty-state"><p>Failed to load corrections.</p></div>
      ) : withCorrections.length === 0 ? (
        <div className="admin-empty-state">
          <i className="bi bi-arrow-down-circle admin-category-dashboard__empty-icon" aria-hidden />
          <p className="admin-form-hint mb-0">No corrections received yet.</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="admin-empty-state"><p>No posts match your search.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Post title</th>
                <th scope="col">Subcategory</th>
                <th scope="col">Sent back</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td className="admin-table__strong">{event.title}</td>
                  <td>{event.subCategory?.name ?? '—'}</td>
                  <td>{formatDate(event.updatedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--edit"
                      title="View details"
                      aria-label={`View details for ${event.title}`}
                      onClick={() => setSelectedEventId(event.id)}
                    >
                      <i className="bi bi-eye" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEvent ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setSelectedEventId('')}>
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <h3 className="admin-modal__title mb-2">{selectedEvent.title}</h3>
              {selectedEvent.description ? <p className="mb-3">{selectedEvent.description}</p> : null}
              <EventPostReviewSummary event={selectedEvent} className="mb-3" />
              <div className="admin-notice admin-notice--info mb-3">
                <p className="admin-form-label mb-1">Category admin notes</p>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{selectedEvent.revertNotes}</p>
              </div>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setSelectedEventId('')}>
                  Close
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    onMakeCorrections(selectedEvent);
                    setSelectedEventId('');
                  }}
                >
                  Make corrections & resubmit
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
