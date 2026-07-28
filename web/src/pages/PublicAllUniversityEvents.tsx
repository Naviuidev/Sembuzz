import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { EventsBottomNav, type EventsBottomNavTab } from '../components/EventsBottomNav';
import {
  publicUniversitiesService,
  type PublicUniversityEvent,
} from '../services/public-universities.service';
import {
  DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ,
  universityEventTitleTooltip,
  formatUniversityEventCardDateLine,
} from '../utils/universityEventDisplay';
import { useUserAuth } from '../contexts/UserAuthContext';
import {
  userNotificationsService,
  USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
} from '../services/user-notifications.service';

const ACCENT = '#2D6BFF';
const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

function EventImage({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (!url || failed) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94A3B8',
          fontSize: '2rem',
        }}
      >
        <i className="bi bi-calendar-event" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={title}
      onError={() => setFailed(true)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
}

function EventCard({ event }: { event: PublicUniversityEvent }) {
  const uniName = event.source?.universityName;
  return (
    <div
      className="uni-event-card"
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      <div style={{ position: 'relative', height: 160, backgroundColor: '#F1F5F9' }}>
        <EventImage url={event.imageUrl} title={event.title} />
        {event.category && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: 'rgba(255,255,255,0.92)',
              color: TEXT_DARK,
              padding: '0.25rem 0.6rem',
              borderRadius: 999,
              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          >
            {event.category}
          </span>
        )}
      </div>
      <div style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {uniName && (
          <Link
            to={`/universities/${event.source.id}`}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: ACCENT,
              textDecoration: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {uniName}
          </Link>
        )}
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: TEXT_DARK,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={universityEventTitleTooltip(event.title, event, DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ)}
        >
          {event.title}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.8rem', color: TEXT_MUTED }}>
          {(event.startDate || event.rawDateText) && (
            <span>
              {event.multiMonthSpan ? (
                <i
                  className="bi bi-arrow-repeat me-1"
                  aria-label="Multi-month event"
                  title="Multi-month event"
                />
              ) : (
                <i className="bi bi-calendar3 me-1" aria-hidden />
              )}
              {formatUniversityEventCardDateLine(event, DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ)}
            </span>
          )}
          {event.venue && (
            <span>
              <i className="bi bi-geo-alt me-1" />
              {event.venue}
            </span>
          )}
        </div>
        {event.contactInfo && (
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            <i className="bi bi-person-lines-fill me-1" />
            {event.contactInfo}
          </div>
        )}
        {event.summary && (
          <p
            style={{
              fontSize: '0.85rem',
              color: '#475569',
              margin: '0.25rem 0 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.summary}
          </p>
        )}
        <div style={{ flex: 1 }} />
        <div className="d-flex" style={{ gap: '0.5rem' }}>
          {event.registrationLink && (
            <a
              href={event.registrationLink}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                textAlign: 'center',
                backgroundColor: ACCENT,
                color: '#fff',
                textDecoration: 'none',
                padding: '0.45rem 0.75rem',
                borderRadius: 8,
                fontWeight: 500,
                fontSize: '0.85rem',
              }}
            >
              Register
            </a>
          )}
          {event.detailUrl && (
            <a
              href={event.detailUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                textAlign: 'center',
                backgroundColor: '#fff',
                color: TEXT_DARK,
                textDecoration: 'none',
                padding: '0.45rem 0.75rem',
                borderRadius: 8,
                fontWeight: 500,
                fontSize: '0.85rem',
                border: '1px solid #D7DEEA',
              }}
            >
              Details
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

type ViewFilter = 'all' | 'upcoming' | 'latest' | 'trending';

export const PublicAllUniversityEvents = () => {
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState<ViewFilter>('all');
  const [sort, setSort] = useState<'startDate' | 'firstSeenAt' | 'title'>('startDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryOpts = useMemo(() => {
    const base: Parameters<typeof publicUniversitiesService.listAllAggregated>[0] = {
      search: debouncedSearch || undefined,
      category: category || undefined,
      sort,
      order,
      pageSize: 48,
    };
    if (view === 'upcoming') base.upcoming = true;
    if (view === 'latest') base.latest = true;
    if (view === 'trending') base.trending = true;
    return base;
  }, [debouncedSearch, category, sort, order, view]);

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'university-events', 'all', queryOpts],
    queryFn: () => publicUniversitiesService.listAllAggregated(queryOpts),
    staleTime: 20_000,
    refetchInterval: 60_000,
  });

  const categoryOptions = useMemo(() => data?.categories ?? [], [data]);

  const { data: unreadNotifData } = useQuery({
    queryKey: USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
    queryFn: () => userNotificationsService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 15_000,
  });
  const notifUnreadCount = unreadNotifData?.unreadCount ?? 0;

  const handleTabSelect = (tab: EventsBottomNavTab) => {
    if (tab === 'universities') {
      navigate('/universities');
      return;
    }
    if (tab === 'chat') {
      navigate('/messages');
      return;
    }
    navigate('/events', { state: { bottomNav: tab } });
  };

  const chip = (id: ViewFilter, label: string) => (
    <button
      type="button"
      key={id}
      onClick={() => setView(id)}
      style={{
        padding: '0.35rem 0.85rem',
        borderRadius: 999,
        border: view === id ? `1px solid ${ACCENT}` : '1px solid #E2E8F0',
        background: view === id ? '#EEF3FF' : '#fff',
        color: view === id ? ACCENT : TEXT_DARK,
        fontSize: '0.82rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '120px' }}>
      <Navbar />

      <div className="container" style={{ maxWidth: '1280px', padding: '1.5rem 1rem' }}>
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <Link to="/universities" style={{ color: TEXT_MUTED, fontSize: '0.9rem', textDecoration: 'none' }}>
            <i className="bi bi-arrow-left me-1" /> Universities
          </Link>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: '1rem 1.1rem',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
            marginBottom: '1rem',
          }}
        >
          <h1 style={{ fontSize: '1.35rem', fontWeight: 600, color: TEXT_DARK, marginBottom: '0.35rem' }}>
            University events
          </h1>
          <p style={{ color: TEXT_MUTED, fontSize: '0.9rem', marginBottom: '0.85rem' }}>
            AI-discovered listings from connected campuses. Use filters to focus on what matters.
          </p>
          <div className="d-flex flex-wrap gap-2 mb-3">{chip('all', 'All')} {chip('upcoming', 'Upcoming')} {chip('latest', 'Latest')} {chip('trending', 'Trending')}</div>
          <div className="d-flex flex-wrap" style={{ gap: '0.5rem' }}>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, venue, organizer..."
              style={{
                flex: '1 1 200px',
                minWidth: 160,
                padding: '0.5rem 0.75rem',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
            <select
              value={`${sort}:${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split(':') as ['startDate' | 'firstSeenAt' | 'title', 'asc' | 'desc'];
                setSort(s);
                setOrder(o);
              }}
              style={selectStyle}
            >
              <option value="startDate:asc">Date (soonest first)</option>
              <option value="startDate:desc">Date (latest first)</option>
              <option value="firstSeenAt:desc">Recently added</option>
              <option value="title:asc">Title A–Z</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: TEXT_MUTED }}>Loading events...</div>
        ) : (data?.items.length ?? 0) === 0 ? (
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
            <i className="bi bi-calendar-x" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
            No events match these filters yet.
          </div>
        ) : (
          <div className="uni-events-grid">
            {data!.items.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .uni-event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
        }
        .uni-events-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        @media (max-width: 1100px) {
          .uni-events-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 820px) {
          .uni-events-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 520px) {
          .uni-events-grid { grid-template-columns: 1fr; }
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

const selectStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  outline: 'none',
  fontSize: '0.9rem',
  backgroundColor: '#fff',
  color: TEXT_DARK,
  minWidth: 160,
};
