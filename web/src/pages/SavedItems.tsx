import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SchoolNavbar } from '../components/SchoolNavbar';
import { EventsBottomNav, type EventsBottomNavTab } from '../components/EventsBottomNav';
import { useUserAuth } from '../contexts/UserAuthContext';
import { userEventsService, type SavedEventItem } from '../services/user-events.service';
import { userNotificationsService, USER_NOTIFICATIONS_UNREAD_QUERY_KEY } from '../services/user-notifications.service';
import { imageSrc } from '../utils/image';

function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

/** Full post detail view (stays on saved screen). */
function SavedEventDetail({ event, onBack }: { event: SavedEventItem; onBack: () => void }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const images = parseImageUrls(event.imageUrls);
  const schoolName = event.school?.name ?? 'School';
  const schoolLogo = event.school?.image ?? null;
  const hasMultipleImages = images.length > 1;
  const goPrev = () => setSlideIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  const goNext = () => setSlideIndex((i) => (i >= images.length - 1 ? 0 : i + 1));

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2 mb-3"
        onClick={onBack}
        aria-label="Back to list"
      >
        <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
        <span style={{ fontWeight: 500, color: '#1a1f2e' }}>Back to list</span>
      </button>
      <article className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="d-flex align-items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #eee' }}>
          {schoolLogo ? (
            <img src={imageSrc(schoolLogo)} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d', fontWeight: 700 }}>
              {schoolName.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '0.95rem' }}>{schoolName}</div>
            <div style={{ fontSize: '0.75rem', color: '#8e8e8e' }}>{event.subCategory?.name ?? 'Post'}</div>
          </div>
        </div>
        {images[0] ? (
          <div style={{ position: 'relative', width: '100%', backgroundColor: '#fafafa' }}>
            <div style={{ overflow: 'hidden', width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  transform: `translateX(-${slideIndex * 100}%)`,
                  transition: 'transform 0.3s ease-out',
                }}
              >
                {images.map((url, i) => (
                  <div key={i} style={{ minWidth: '100%', flexShrink: 0, minHeight: 'min(300px, 40vh)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={imageSrc(url)} alt="" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>
            {hasMultipleImages && (
              <>
                <button type="button" onClick={goPrev} aria-label="Previous" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', cursor: 'pointer' }}>
                  <i className="bi bi-chevron-left" />
                </button>
                <button type="button" onClick={goNext} aria-label="Next" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', cursor: 'pointer' }}>
                  <i className="bi bi-chevron-right" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ minHeight: '200px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8e8e' }}>
            <i className="bi bi-image" style={{ fontSize: '3rem' }} />
          </div>
        )}
        <div className="px-3 py-3">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1f2e', marginBottom: '0.5rem' }}>{event.title}</h2>
          {event.description && <p className="text-muted mb-2 small" style={{ lineHeight: 1.5 }}>{event.description}</p>}
          {event.externalLink && (
            <a href={event.externalLink} target="_blank" rel="noopener noreferrer" className="small">Link</a>
          )}
        </div>
      </article>
    </div>
  );
}

/** Compact row — same layout as Liked news list in PublicEvents */
function SavedEventRow({ event, onSelect }: { event: SavedEventItem; onSelect: () => void }) {
  const schoolName = event.school?.name ?? 'School';
  const schoolLogo = event.school?.image ?? null;
  const location = event.school?.city ?? event.school?.name ?? event.subCategory?.name ?? '—';

  return (
    <div
      className="d-flex align-items-center gap-3 p-3 rounded-3 border bg-white"
      style={{ borderColor: '#eee', cursor: 'pointer' }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {schoolLogo ? (
        <img src={imageSrc(schoolLogo)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d', fontWeight: 700, flexShrink: 0 }}>
          {schoolName.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      )}
      <div className="flex-grow-1 min-w-0">
        <div style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '0.95rem' }}>{event.title}</div>
        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{location}</div>
      </div>
      <i className="bi bi-chevron-right text-muted" style={{ fontSize: '1rem' }} aria-hidden />
    </div>
  );
}

export const SavedItems = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<SavedEventItem | null>(null);

  const { data: savedEvents = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['user', 'events', 'saved'],
    queryFn: () => userEventsService.getSavedEvents(),
    enabled: !!user,
  });

  const { data: unreadNotifData } = useQuery({
    queryKey: USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
    queryFn: () => userNotificationsService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 15_000,
  });
  const notifUnreadCount = unreadNotifData?.unreadCount ?? 0;

  const handleBottomNav = (tab: EventsBottomNavTab) => {
    if (tab === 'blogs') {
      navigate('/blogs');
      return;
    }
    navigate('/events', { state: { bottomNav: tab } });
  };

  if (!user) {
    navigate('/events', { replace: true, state: { openAuth: 'login' } });
    return null;
  }

  const loadError = isError ? 'Could not load saved news. Pull down to try again.' : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa', paddingBottom: '5.5rem' }}>
      <SchoolNavbar />
      <div className="container py-4" style={{ maxWidth: 640 }}>
        {selectedEvent ? (
          <SavedEventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />
        ) : (
          <>
            <div className="d-flex align-items-center gap-2 mb-3">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none d-flex align-items-center"
                onClick={() => navigate('/events', { state: { bottomNav: 'settings' } })}
                aria-label="Back to Settings"
              >
                <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
              </button>
              <h1 className="mb-0" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1f2e' }}>
                Saved news
              </h1>
            </div>

            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" role="status" />
                <p className="mt-2 mb-0 text-muted small">Loading…</p>
              </div>
            ) : loadError && savedEvents.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted small mb-3">{loadError}</p>
                <button type="button" className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => void refetch()}>
                  Try again
                </button>
              </div>
            ) : savedEvents.length === 0 ? (
              <p className="text-muted text-center py-5 small mb-0">
                No saved posts yet. Save posts from your home feed to see them here.
              </p>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxWidth: 600, margin: '0 auto' }}>
                {savedEvents.map((event: SavedEventItem) => (
                  <SavedEventRow key={event.id} event={event} onSelect={() => setSelectedEvent(event)} />
                ))}
              </div>
            )}

            {!isLoading && savedEvents.length > 0 && (
              <div className="text-center mt-3">
                <button type="button" className="btn btn-link btn-sm text-muted" onClick={() => void refetch()}>
                  Refresh
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <EventsBottomNav
        activeTab="settings"
        onSelectTab={handleBottomNav}
        notifUnreadCount={notifUnreadCount}
      />
    </div>
  );
};
