import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { EventsBottomNav, type EventsBottomNavTab } from '../components/EventsBottomNav';
import { publicUniversitiesService, type PublicUniversity } from '../services/public-universities.service';
import { useUserAuth } from '../contexts/UserAuthContext';
import {
  userNotificationsService,
  USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
} from '../services/user-notifications.service';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

/**
 * Some ingested rows store the events URL in `universityName`. For the card we want a
 * readable title (hostname) on the first line and the full URL on the second.
 */
function getUniversityCardTitle(uni: PublicUniversity): string {
  const raw = (uni.universityName || '').trim();
  const url = (uni.url || '').trim();
  const sameUrl =
    raw.length > 0 &&
    url.length > 0 &&
    raw.replace(/\/+$/, '').toLowerCase() === url.replace(/\/+$/, '').toLowerCase();
  const nameIsJustUrl = /^https?:\/\//i.test(raw) || sameUrl;

  if (raw && !nameIsJustUrl) {
    return raw;
  }

  const parseHost = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  if (raw && /^https?:\/\//i.test(raw)) {
    const h = parseHost(raw);
    if (h) return h;
  }

  const h = parseHost(url);
  return h || raw || url || 'University';
}

function UniversityLogo({ uni }: { uni: PublicUniversity }) {
  const displayTitle = getUniversityCardTitle(uni);
  const [failed, setFailed] = useState(false);
  if (!failed && uni.logoUrl) {
    return (
      <img
        src={uni.logoUrl}
        alt={displayTitle}
        onError={() => setFailed(true)}
        style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 12, background: '#fff' }}
      />
    );
  }
  const initial = displayTitle.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#EEF3FF',
        color: '#2D6BFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        fontWeight: 700,
      }}
    >
      {initial}
    </div>
  );
}

export const PublicUniversities = () => {
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const [search, setSearch] = useState('');

  const {
    data: universities = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['public', 'universities'],
    queryFn: publicUniversitiesService.listAll,
    staleTime: 30_000,
    retry: 2,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter((u) => {
      const title = getUniversityCardTitle(u).toLowerCase();
      const isScraped = u.feedKind === 'scraped';
      if (q === 'scraped' || q === 'url' || q === 'feed') return isScraped;
      return (
        title.includes(q) ||
        u.universityName.toLowerCase().includes(q) ||
        u.url.toLowerCase().includes(q)
      );
    });
  }, [universities, search]);

  const { data: unreadNotifData } = useQuery({
    queryKey: USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
    queryFn: () => userNotificationsService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 15_000,
  });
  const notifUnreadCount = unreadNotifData?.unreadCount ?? 0;

  const handleTabSelect = (tab: EventsBottomNavTab) => {
    if (tab === 'universities') return;
    if (tab === 'blogs') {
      navigate('/blogs');
      return;
    }
    navigate('/events', { state: { bottomNav: tab } });
  };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '120px' }}>
      <Navbar />

      <div className="container" style={{ maxWidth: '900px', padding: '1.5rem 1rem' }}>
        <div className="mb-3 d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: TEXT_DARK, marginBottom: '0.25rem' }}>
              Universities
            </h1>
            <p style={{ color: TEXT_MUTED, marginBottom: 0 }}>
              Browse events from universities and <strong>synced calendar pages</strong> (Super Admin → Fetch
              events). Each card shows stored event count and last sync time where available.
            </p>
          </div>
          <Link
            to="/university-events"
            className="btn btn-outline-primary btn-sm"
            style={{ borderRadius: 10, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            All university events
          </Link>
        </div>

        <div
          className="mb-3 d-flex align-items-center"
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: '0.5rem 0.875rem',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
            gap: '0.5rem',
          }}
        >
          <i className="bi bi-search" style={{ color: TEXT_MUTED }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search universities..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              padding: '0.4rem 0',
              fontSize: '0.95rem',
              color: TEXT_DARK,
              background: 'transparent',
            }}
          />
        </div>

        {isError ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: '#991B1B',
              backgroundColor: '#fff',
              borderRadius: 12,
              border: '1px solid #FECACA',
            }}
          >
            <i className="bi bi-wifi-off" style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>Couldn&apos;t load universities</div>
            <div style={{ fontSize: '0.875rem', color: TEXT_MUTED, marginBottom: '1rem' }}>
              {(() => {
                const e = error as { response?: { data?: { message?: string } }; message?: string };
                return e?.response?.data?.message || e?.message || 'Check that the API is running and try again.';
              })()}
            </div>
            <button
              type="button"
              className="btn btn-dark btn-sm"
              style={{ borderRadius: 8 }}
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        ) : isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: TEXT_MUTED }}>Loading universities...</div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: TEXT_MUTED,
              backgroundColor: '#fff',
              borderRadius: 12,
              border: '1px dashed #CBD5E1',
            }}
          >
            <i className="bi bi-mortarboard" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
            {universities.length === 0 ? (
              <>
                No universities yet. Check back soon.
                <p style={{ fontSize: '0.85rem', color: TEXT_MUTED, marginTop: '0.75rem', marginBottom: 0, maxWidth: 420, marginInline: 'auto' }}>
                  Add <strong>active</strong> sources from the legacy university CSV tool or from{' '}
                  <strong>Super Admin → Fetch events</strong> (URL scrape). Ensure the API in{' '}
                  <code className="user-select-all">VITE_API_URL</code> is reachable (e.g.{' '}
                  <code>http://localhost:3000</code>).
                </p>
              </>
            ) : (
              'No universities match your search.'
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {filtered.map((uni) => {
              const cardTitle = getUniversityCardTitle(uni);
              const feedLabel = uni.feedKind === 'scraped' ? 'URL feed' : 'University feed';
              const lastSync =
                uni.lastSyncedAt != null
                  ? new Date(uni.lastSyncedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : null;
              return (
              <button
                key={uni.id}
                type="button"
                onClick={() => navigate(`/universities/${uni.id}`)}
                className="university-card"
                style={{
                  background: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '1.1rem',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
              >
                <div className="d-flex align-items-start" style={{ gap: '0.75rem' }}>
                  <div style={{ flexShrink: 0 }}>
                    <UniversityLogo uni={uni} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: TEXT_DARK,
                        fontSize: '1rem',
                        lineHeight: 1.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                      title={cardTitle}
                    >
                      {cardTitle}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: TEXT_MUTED,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={uni.url}
                    >
                      {uni.url}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: TEXT_MUTED,
                        lineHeight: 1.3,
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          marginRight: 8,
                          padding: '0.12rem 0.45rem',
                          borderRadius: 6,
                          fontWeight: 600,
                          background: uni.feedKind === 'scraped' ? '#ECFDF5' : '#F1F5F9',
                          color: uni.feedKind === 'scraped' ? '#047857' : '#475569',
                        }}
                      >
                        {feedLabel}
                      </span>
                      {lastSync ? <>Last sync: {lastSync}</> : <>Not synced yet</>}
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-between mt-auto">
                  <span
                    style={{
                      backgroundColor: '#EEF3FF',
                      color: '#2D6BFF',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {uni.totalEvents} event{uni.totalEvents === 1 ? '' : 's'}
                  </span>
                  <span style={{ color: '#2D6BFF', fontSize: '0.85rem', fontWeight: 500 }}>
                    View <i className="bi bi-arrow-right" />
                  </span>
                </div>
              </button>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .university-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
        }
      `}</style>

      <EventsBottomNav
        activeTab="universities"
        onSelectTab={handleTabSelect}
        notifUnreadCount={notifUnreadCount}
      />
    </div>
  );
};
