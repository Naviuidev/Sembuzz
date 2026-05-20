import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { Navbar } from '../components/Navbar';
import { EventsBottomNav, type EventsBottomNavTab } from '../components/EventsBottomNav';
import {
  publicUniversitiesService,
  type PublicUniversityEvent,
  type PublicUniversityIngestionWindowUtc,
} from '../services/public-universities.service';
import { useUserAuth } from '../contexts/UserAuthContext';
import {
  userNotificationsService,
  USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
} from '../services/user-notifications.service';
import {
  DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ,
  shortUniversityTimeZoneLabel,
  universityEventTitleTooltip,
  formatIngestionMonthWindowLabel,
  formatOccurrenceDatesTooltip,
  formatUniversityEventCardDateLine,
  formatUniversityEventCardDateWithOccurrences,
  universityEventSpansOutsideMonth,
} from '../utils/universityEventDisplay';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
/** Neutral “selected” surface (replaces light blue on this page). */
const EMPHASIS_SURFACE = '#F1F5F9';

/** Same typography + pill shape as All / Upcoming / Latest / Trending */
const pillText = {
  fontSize: '0.78rem',
  fontWeight: 600,
  fontFamily: 'inherit',
} as const;

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'%3E%3Cpath fill='%2364748b' d='M3.5 5.5 8 10l4.5-4.5'/%3E%3C/svg%3E\")";

function pillSurface(active: boolean, opts?: { cursor?: string }): CSSProperties {
  return {
    ...pillText,
    borderRadius: 999,
    border: active ? `1px solid ${TEXT_DARK}` : '1px solid #E2E8F0',
    background: active ? EMPHASIS_SURFACE : '#fff',
    color: TEXT_DARK,
    cursor: opts?.cursor ?? 'pointer',
    outline: 'none',
  };
}

function IngestionZoneCalendarPopover({
  w,
  open,
  selectedLocalYmd,
  onToggleDay,
  onClearDay,
}: {
  w: PublicUniversityIngestionWindowUtc;
  open: boolean;
  selectedLocalYmd: string | null;
  onToggleDay: (localYmd: string) => void;
  onClearDay: () => void;
}) {
  const tz = w.timeZone || DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ;
  const [yDisp, setYDisp] = useState(2026);
  const [m0Disp, setM0Disp] = useState(0);

  useEffect(() => {
    if (!open) return;
    const anchor = DateTime.fromISO(w.computedAt, { zone: 'utc' }).setZone(tz).startOf('day');
    setYDisp(anchor.year);
    setM0Disp(anchor.month - 1);
  }, [open, w.computedAt, tz]);

  const monthStart = DateTime.fromObject({ year: yDisp, month: m0Disp + 1, day: 1 }, { zone: tz });
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  }).format(monthStart.toJSDate());

  const luxWeekday = monthStart.weekday;
  const startDow = luxWeekday === 7 ? 0 : luxWeekday;
  const daysInMonth = monthStart.daysInMonth ?? 31;
  const dowLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const goPrevMonth = () => {
    const d = monthStart.minus({ months: 1 });
    setYDisp(d.year);
    setM0Disp(d.month - 1);
  };
  const goNextMonth = () => {
    const d = monthStart.plus({ months: 1 });
    setYDisp(d.year);
    setM0Disp(d.month - 1);
  };

  const zoneShort = shortUniversityTimeZoneLabel(tz);

  const circleBtn = {
    width: 34,
    height: 34,
    borderRadius: '50%',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'background-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 100,
        width: 'min(320px, calc(100vw - 2rem))',
        padding: '1rem 1.15rem 1.1rem',
        backgroundColor: '#fff',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(15, 23, 42, 0.15), 0 2px 8px rgba(15, 23, 42, 0.08)',
        border: '1px solid #E2E8F0',
      }}
      role="dialog"
      aria-label={`Pick a ${zoneShort} time zone day to filter events`}
    >
      <div
        className="d-flex align-items-center"
        style={{
          marginBottom: '0.85rem',
          gap: 10,
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={goPrevMonth}
          aria-label="Previous month"
          style={{
            border: 'none',
            background: '#F1F5F9',
            width: 36,
            height: 36,
            borderRadius: 10,
            cursor: 'pointer',
            color: TEXT_DARK,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="bi bi-chevron-left" />
        </button>
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.95rem',
            color: TEXT_DARK,
            flex: 1,
            textAlign: 'center',
            minWidth: 0,
            paddingInline: 4,
          }}
        >
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Next month"
          style={{
            border: 'none',
            background: '#F1F5F9',
            width: 36,
            height: 36,
            borderRadius: 10,
            cursor: 'pointer',
            color: TEXT_DARK,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="bi bi-chevron-right" />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          columnGap: 4,
          fontSize: '0.7rem',
          textAlign: 'center',
          color: TEXT_MUTED,
          marginBottom: 10,
          paddingBottom: 2,
          letterSpacing: '0.02em',
        }}
      >
        {dowLabels.map((d) => (
          <span key={d} style={{ padding: '2px 0' }}>
            {d}
          </span>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          columnGap: 8,
          rowGap: 12,
        }}
      >
        {Array.from({ length: startDow }, (_, i) => (
          <span key={`pad-${i}`} style={{ minHeight: 38 }} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const localYmd = DateTime.fromObject(
            { year: yDisp, month: m0Disp + 1, day },
            { zone: tz },
          ).toISODate()!;
          const inRange = localYmd >= w.firstDayInclusive && localYmd <= w.lastDayInclusive;
          const selected = selectedLocalYmd === localYmd;
          return (
            <div
              key={localYmd}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 40,
              }}
            >
              <button
                type="button"
                disabled={!inRange}
                onClick={() => inRange && onToggleDay(localYmd)}
                title={inRange ? `${zoneShort} ${localYmd}` : 'Outside sync window'}
                style={{
                  ...circleBtn,
                  color: inRange ? (selected ? '#fff' : TEXT_DARK) : TEXT_MUTED,
                  backgroundColor: inRange ? (selected ? TEXT_DARK : EMPHASIS_SURFACE) : '#F8FAFC',
                  opacity: inRange ? 1 : 0.28,
                  cursor: inRange ? 'pointer' : 'not-allowed',
                  boxShadow: selected && inRange ? `0 0 0 2px rgba(26, 31, 46, 0.35)` : 'none',
                  border:
                    selected && inRange ? `1px solid ${TEXT_DARK}` : inRange ? '1px solid #E2E8F0' : '1px solid #E2E8F0',
                }}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>

      {selectedLocalYmd && (
        <div
          className="d-flex justify-content-between align-items-center"
          style={{
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #F1F5F9',
            gap: 12,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: TEXT_MUTED }}>
            {zoneShort} <strong style={{ color: TEXT_DARK }}>{selectedLocalYmd}</strong>
          </span>
          <button
            type="button"
            onClick={onClearDay}
            style={{
              border: 'none',
              background: 'transparent',
              color: TEXT_DARK,
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.2rem 0.4rem',
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

function IngestionWindowCalendarButton({
  w,
  selectedLocalYmd,
  onToggleDay,
  onClearDay,
}: {
  w?: PublicUniversityIngestionWindowUtc;
  selectedLocalYmd: string | null;
  onToggleDay: (localYmd: string) => void;
  onClearDay: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tzLabel = w?.timeZone ? shortUniversityTimeZoneLabel(w.timeZone) : 'Eastern';

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!w) return null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={`Filter by ${tzLabel} calendar day`}
        style={{
          padding: '0.3rem 0.65rem',
          ...pillSurface(!!open || !!selectedLocalYmd),
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <i className="bi bi-calendar3" aria-hidden />
        Dates
      </button>
      {open && (
        <IngestionZoneCalendarPopover
          w={w}
          open={open}
          selectedLocalYmd={selectedLocalYmd}
          onToggleDay={(iso) => {
            onToggleDay(iso);
            setOpen(false);
          }}
          onClearDay={() => {
            onClearDay();
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** Same 64×64 treatment as university cards on `/universities`. */
function EventThumb({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (!url || failed) {
    return (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          backgroundColor: EMPHASIS_SURFACE,
          color: TEXT_DARK,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
        aria-hidden
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
        width: 64,
        height: 64,
        objectFit: 'cover',
        borderRadius: 12,
        background: '#fff',
        flexShrink: 0,
      }}
    />
  );
}

const iconLinkBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 10,
  color: TEXT_DARK,
  textDecoration: 'none',
  transition: 'background 0.15s ease',
};

function OccurrenceDatesLoopIcon({
  dates,
  timeZone,
}: {
  dates: string[];
  timeZone: string;
}) {
  const [open, setOpen] = useState(false);
  const tip = formatOccurrenceDatesTooltip(dates, timeZone);
  if (!tip) return null;

  return (
    <span
      className="uni-occurrence-loop-wrap"
      style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <i
        className="bi bi-arrow-repeat"
        style={{ fontSize: '0.85rem', color: '#B91C1C', cursor: 'help' }}
        tabIndex={0}
        aria-label={`${dates.length} dates this month`}
      />
      {open && tip && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'calc(100% + 8px)',
            transform: 'translateX(-50%)',
            zIndex: 40,
            minWidth: 200,
            maxWidth: 280,
            padding: '0.55rem 0.7rem',
            background: '#1a1f2e',
            color: '#fff',
            fontSize: '0.72rem',
            lineHeight: 1.45,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            whiteSpace: 'pre-line',
            pointerEvents: 'none',
          }}
        >
          {tip}
        </span>
      )}
    </span>
  );
}

function EventCard({
  event,
  displayTimeZone,
  ingestionWindow,
}: {
  event: PublicUniversityEvent;
  displayTimeZone: string;
  ingestionWindow?: PublicUniversityIngestionWindowUtc;
}) {
  const goHref = event.registrationLink || event.detailUrl;
  const multiMonth =
    Boolean(event.multiMonthSpan) || universityEventSpansOutsideMonth(event, ingestionWindow);
  const occurrenceDates = event.occurrenceDates ?? [];
  const tooltipDates =
    occurrenceDates.length > 1 && event.occurrenceDisplayYmd
      ? occurrenceDates.filter((d) => d !== event.occurrenceDisplayYmd)
      : occurrenceDates;
  const hasMultipleOccurrences = Boolean(event.multipleOccurrencesInMonth) || occurrenceDates.length > 1;
  const dateLine =
    event.startDate || event.rawDateText || occurrenceDates.length
      ? hasMultipleOccurrences
        ? formatUniversityEventCardDateWithOccurrences(event, displayTimeZone)
        : formatUniversityEventCardDateLine(event, displayTimeZone)
      : null;
  const titleTooltip = [
    universityEventTitleTooltip(event.title, event, displayTimeZone),
    multiMonth ? 'Runs across multiple months (includes this month).' : '',
    hasMultipleOccurrences ? formatOccurrenceDatesTooltip(tooltipDates, displayTimeZone) : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <div
      className="uni-event-card university-card"
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '1.1rem',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        boxShadow: multiMonth
          ? '0 0 0 2px #DC2626, 0 4px 14px rgba(220, 38, 38, 0.12)'
          : '0 4px 14px rgba(15, 23, 42, 0.06)',
        height: '100%',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      <div className="d-flex align-items-start" style={{ gap: '0.75rem' }}>
        <EventThumb url={event.imageUrl} title={event.title} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              color: TEXT_DARK,
              fontSize: '1rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
            title={titleTooltip}
          >
            {event.title}
          </div>
          {dateLine && (
            <div
              style={{
                fontSize: '0.78rem',
                color: TEXT_MUTED,
                marginTop: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title={dateLine}
            >
              {hasMultipleOccurrences ? (
                <OccurrenceDatesLoopIcon dates={tooltipDates.length ? tooltipDates : occurrenceDates} timeZone={displayTimeZone} />
              ) : (
                <i className="bi bi-calendar3 flex-shrink-0" aria-hidden />
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{dateLine}</span>
            </div>
          )}
          {event.venue && (
            <div
              style={{
                fontSize: '0.78rem',
                color: TEXT_MUTED,
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={event.venue}
            >
              <i className="bi bi-geo-alt me-1" aria-hidden />
              {event.venue}
            </div>
          )}
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between mt-auto" style={{ gap: '0.5rem' }}>
        <span
          style={{
            backgroundColor: EMPHASIS_SURFACE,
            color: TEXT_DARK,
            padding: '0.2rem 0.6rem',
            borderRadius: 999,
            fontSize: '0.75rem',
            fontWeight: 600,
            maxWidth: '55%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={event.category || undefined}
        >
          {event.category || 'Event'}
        </span>
        <div className="d-flex align-items-center" style={{ gap: 4 }}>
          {goHref && (
            <a
              href={goHref}
              target="_blank"
              rel="noreferrer"
              className="uni-event-icon-link"
              title="Open event link"
              aria-label="Open event link"
              style={iconLinkBase}
            >
              <i className="bi bi-arrow-right" style={{ fontSize: '1.05rem' }} aria-hidden />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export const PublicUniversityEvents = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUserAuth();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState<'all' | 'upcoming' | 'latest' | 'trending'>('all');
  const [calendarDayLocal, setCalendarDayLocal] = useState<string | null>(null);
  const [sort, setSort] = useState<'startDate' | 'firstSeenAt' | 'title'>('startDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: university, isLoading: uniLoading, isError: uniError } = useQuery({
    queryKey: ['public', 'universities', id],
    queryFn: () => publicUniversitiesService.getOne(id),
    enabled: !!id,
  });

  const displayTz = useMemo(
    () => university?.ingestionWindowUtc?.timeZone ?? DEFAULT_UNIVERSITY_EVENT_DISPLAY_TZ,
    [university?.ingestionWindowUtc?.timeZone],
  );

  const listQuery = useMemo(() => {
    const q: Parameters<typeof publicUniversitiesService.listEvents>[1] = {
      search: debouncedSearch || undefined,
      category: category || undefined,
      sort,
      order,
      pageSize: 48,
    };
    if (view === 'upcoming') q.upcoming = true;
    if (view === 'latest') q.latest = true;
    if (view === 'trending') q.trending = true;
    if (calendarDayLocal) q.dateUtc = calendarDayLocal;
    return q;
  }, [debouncedSearch, category, sort, order, view, calendarDayLocal]);

  const { data, isLoading: eventsLoading } = useQuery({
    queryKey: ['public', 'universities', id, 'events', listQuery],
    queryFn: () => publicUniversitiesService.listEvents(id, listQuery),
    enabled: !!id,
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
        <button
          type="button"
          onClick={() => navigate('/universities')}
          style={{
            background: 'transparent',
            border: 'none',
            color: TEXT_MUTED,
            fontSize: '0.9rem',
            padding: 0,
            cursor: 'pointer',
            marginBottom: '0.75rem',
          }}
        >
          <i className="bi bi-arrow-left me-1" /> Universities
        </button>

        {uniLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: TEXT_MUTED }}>Loading...</div>
        ) : uniError || !university ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#B91C1C' }}>
            We couldn't load this university.
          </div>
        ) : (
          <>
            <div
              className="uni-header mb-3"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem 1rem',
                backgroundColor: '#fff',
                borderRadius: 14,
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div
                className="d-flex align-items-center"
                style={{ gap: '0.85rem', flex: '0 0 auto', minWidth: 0 }}
              >
                {university.logoUrl ? (
                  <img
                    src={university.logoUrl}
                    alt={university.universityName}
                    style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 12, background: '#fff' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      backgroundColor: EMPHASIS_SURFACE,
                      color: TEXT_DARK,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.3rem',
                    }}
                  >
                    {university.universityName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0, maxWidth: 260 }}>
                  <h1
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: TEXT_DARK,
                      margin: 0,
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={university.universityName}
                  >
                    {university.universityName}
                  </h1>
                  <a
                    href={university.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '0.8rem',
                      color: TEXT_MUTED,
                      textDecoration: 'none',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={university.url}
                  >
                    {university.url}
                  </a>
                  {(university.feedKind === 'scraped' || university.lastSyncedAt) && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: TEXT_MUTED }}>
                      {university.feedKind === 'scraped' && (
                        <span
                          style={{
                            display: 'inline-block',
                            marginRight: 8,
                            padding: '0.12rem 0.45rem',
                            borderRadius: 6,
                            fontWeight: 600,
                            background: '#ECFDF5',
                            color: '#047857',
                          }}
                        >
                          URL feed (scraped)
                        </span>
                      )}
                      {university.lastSyncedAt && (
                        <span>
                          Fetched:{' '}
                          {new Date(university.lastSyncedAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="d-flex flex-wrap align-items-center"
                style={{ gap: 6, flex: '1 1 280px', minWidth: 0, justifyContent: 'flex-end' }}
              >
                {(['all', 'upcoming', 'latest', 'trending'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      ...pillSurface(view === v),
                    }}
                  >
                    {v === 'all' ? 'This month' : v === 'upcoming' ? 'Upcoming' : v === 'latest' ? 'Latest' : 'Trending'}
                  </button>
                ))}
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events..."
                  style={{
                    ...pillSurface(search.trim().length > 0, { cursor: 'text' }),
                    flex: '1 1 120px',
                    minWidth: 100,
                    maxWidth: 220,
                    padding: '0.3rem 0.65rem',
                    boxSizing: 'border-box',
                  }}
                />
                <select
                  className="uni-pill-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    ...pillSurface(!!category),
                    padding: '0.3rem 1.65rem 0.3rem 0.65rem',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: SELECT_CHEVRON,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.55rem center',
                    backgroundSize: '10px 10px',
                    minWidth: 132,
                    maxWidth: 200,
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">All categories</option>
                  {categoryOptions.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
                <select
                  className="uni-pill-select"
                  value={`${sort}:${order}`}
                  onChange={(e) => {
                    const [s, o] = e.target.value.split(':') as [
                      'startDate' | 'firstSeenAt' | 'title',
                      'asc' | 'desc',
                    ];
                    setSort(s);
                    setOrder(o);
                  }}
                  style={{
                    ...pillSurface(`${sort}:${order}` !== 'startDate:asc'),
                    padding: '0.3rem 1.65rem 0.3rem 0.65rem',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: SELECT_CHEVRON,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.55rem center',
                    backgroundSize: '10px 10px',
                    minWidth: 148,
                    maxWidth: 220,
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="startDate:asc">Date (soonest first)</option>
                  <option value="startDate:desc">Date (latest first)</option>
                  <option value="firstSeenAt:desc">Recently added</option>
                  <option value="title:asc">Title A–Z</option>
                </select>
                <IngestionWindowCalendarButton
                  w={university.ingestionWindowUtc}
                  selectedLocalYmd={calendarDayLocal}
                  onToggleDay={(iso) => setCalendarDayLocal((p) => (p === iso ? null : iso))}
                  onClearDay={() => setCalendarDayLocal(null)}
                />
                {calendarDayLocal && (
                  <button
                    type="button"
                    onClick={() => setCalendarDayLocal(null)}
                    title="Clear day filter"
                    style={{
                      padding: '0.3rem 0.65rem',
                      ...pillSurface(true),
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {shortUniversityTimeZoneLabel(displayTz)} {calendarDayLocal}
                    <i className="bi bi-x-lg" style={{ fontSize: '0.65rem' }} aria-hidden />
                  </button>
                )}
              </div>
            </div>

            {view === 'all' && university.ingestionWindowUtc && !calendarDayLocal && (
              <p style={{ fontSize: '0.8rem', color: TEXT_MUTED, margin: '0 0 0.75rem' }}>
                Showing events in{' '}
                <strong style={{ color: TEXT_DARK }}>
                  {formatIngestionMonthWindowLabel(university.ingestionWindowUtc)}
                </strong>{' '}
                ({shortUniversityTimeZoneLabel(displayTz)}), including programs that run before or after this month.{' '}
                <span style={{ color: '#DC2626', fontWeight: 600 }}>Red border</span> = spans outside this month.{' '}
                <i className="bi bi-arrow-repeat" style={{ color: '#B91C1C' }} aria-hidden /> = more dates this month
                (hover for list).
              </p>
            )}

            {eventsLoading ? (
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
                {calendarDayLocal
                  ? `No events for ${shortUniversityTimeZoneLabel(displayTz)} ${calendarDayLocal} with the current filters. Try This month or another day.`
                  : view === 'all' && university.ingestionWindowUtc
                    ? `No events for ${formatIngestionMonthWindowLabel(university.ingestionWindowUtc)} yet. Run sync in admin or try Upcoming.`
                    : 'No events yet for this university.'}
              </div>
            ) : (
              <div className="uni-events-grid">
                {data!.items.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    displayTimeZone={displayTz}
                    ingestionWindow={university.ingestionWindowUtc}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .uni-pill-select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        .uni-pill-select::-ms-expand {
          display: none;
        }
        .university-card.uni-event-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
        }
        .uni-event-icon-link:hover {
          background: rgba(0, 0, 0, 0.06);
        }
        .uni-events-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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

