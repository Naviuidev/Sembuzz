import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EventsStudentShell } from '../components/EventsStudentShell';
import { useUserAuth } from '../contexts/UserAuthContext';
import { userEventsService, type SavedEventItem } from '../services/user-events.service';
import {
  userExternalFeedService,
  type SavedExternalPostRow,
} from '../services/user-external-feed.service';
import { imageSrc } from '../utils/image';
import { EventPostPublicContent } from '../components/EventPostPublicContent';
import { ExternalPublicPostCard } from '../components/ExternalPublicPostCard';
import { externalPostContentTypeLabel } from '../utils/externalOfferPostView';
import {
  filterSavedExternalByTab,
  parseSavedTabParam,
  savedExternalDisplayName,
  savedExternalSubtitle,
  type SavedCollectionTab,
} from '../utils/savedCollections';

const TAB_LABELS: Record<SavedCollectionTab, string> = {
  news: 'School news',
  jobs: 'Jobs',
  offers: 'Offers',
  campaigns: 'Campaigns',
};

function contentTypeBadgeClass(contentType: string): string {
  if (contentType === 'job') return 'saved-items-badge saved-items-badge--job';
  if (contentType === 'offer') return 'saved-items-badge saved-items-badge--offer';
  if (contentType === 'campaign') return 'saved-items-badge saved-items-badge--campaign';
  return 'saved-items-badge saved-items-badge--event';
}

function SavedEventDetail({ event, onBack }: { event: SavedEventItem; onBack: () => void }) {
  return (
    <>
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
        <div className="px-3 py-3">
          <EventPostPublicContent event={event} showHero />
        </div>
      </article>
    </>
  );
}

function SavedEventRow({ event, onSelect }: { event: SavedEventItem; onSelect: () => void }) {
  const schoolName = event.school?.name ?? 'School';
  const schoolLogo = event.school?.image ?? null;
  const location = event.school?.city ?? event.subCategory?.name ?? '—';

  return (
    <div
      className="saved-items-row"
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
        <img src={imageSrc(schoolLogo)} alt="" className="saved-items-row__avatar" />
      ) : (
        <div className="saved-items-row__avatar saved-items-row__avatar--fallback">
          {schoolName.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      )}
      <div className="saved-items-row__body">
        <span className="saved-items-badge saved-items-badge--news">School news</span>
        {event.subCategory?.name ? (
          <span className="saved-items-badge saved-items-badge--cat">{event.subCategory.name}</span>
        ) : null}
        <div className="saved-items-row__title">{event.title}</div>
        <div className="saved-items-row__sub">{location}</div>
      </div>
      <i className="bi bi-chevron-right text-muted" aria-hidden />
    </div>
  );
}

function SavedExternalRow({
  row,
  onSelect,
}: {
  row: SavedExternalPostRow;
  onSelect: () => void;
}) {
  const typeLabel = externalPostContentTypeLabel(row);
  const displayName = savedExternalDisplayName(row);
  const sub = savedExternalSubtitle(row);

  return (
    <div
      className="saved-items-row"
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
      <div className="saved-items-row__avatar saved-items-row__avatar--external">
        <i className="bi bi-briefcase" aria-hidden />
      </div>
      <div className="saved-items-row__body">
        <span className={contentTypeBadgeClass(row.contentType ?? 'event')}>{typeLabel}</span>
        {row.externalCategory?.name ? (
          <span className="saved-items-badge saved-items-badge--cat">{row.externalCategory.name}</span>
        ) : null}
        <div className="saved-items-row__title">{displayName}</div>
        {sub ? <div className="saved-items-row__sub">{sub}</div> : null}
      </div>
      <i className="bi bi-chevron-right text-muted" aria-hidden />
    </div>
  );
}

function SavedExternalDetail({
  row,
  onBack,
  onUnsave,
}: {
  row: SavedExternalPostRow;
  onBack: () => void;
  onUnsave: () => void;
}) {
  return (
    <>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
          onClick={onBack}
          aria-label="Back to list"
        >
          <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
          <span style={{ fontWeight: 500, color: '#1a1f2e' }}>Back to list</span>
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill" onClick={onUnsave}>
          Remove
        </button>
      </div>
      <div className="d-flex flex-wrap gap-2 mb-2">
        <span className={contentTypeBadgeClass(row.contentType ?? 'event')}>{externalPostContentTypeLabel(row)}</span>
        {row.externalCategory?.name ? (
          <span className="saved-items-badge saved-items-badge--cat">{row.externalCategory.name}</span>
        ) : null}
      </div>
      <article className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="p-2">
          <ExternalPublicPostCard row={row} isSaved onToggleSave={onUnsave} />
        </div>
      </article>
    </>
  );
}

export const SavedItems = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseSavedTabParam(searchParams.get('tab'));
  const [selectedEvent, setSelectedEvent] = useState<SavedEventItem | null>(null);
  const [selectedExternal, setSelectedExternal] = useState<SavedExternalPostRow | null>(null);

  const setTab = (next: SavedCollectionTab) => {
    setSearchParams({ tab: next }, { replace: true });
    setSelectedEvent(null);
    setSelectedExternal(null);
  };

  const { data: savedEvents = [], isLoading: newsLoading, isError: newsError, refetch: refetchNews } = useQuery({
    queryKey: ['user', 'events', 'saved'],
    queryFn: () => userEventsService.getSavedEvents(),
    enabled: !!user,
  });

  const { data: savedExternal = [], isLoading: extLoading, isError: extError, refetch: refetchExt } = useQuery({
    queryKey: ['user', 'external-feed', 'saved'],
    queryFn: () => userExternalFeedService.getSavedPosts(),
    enabled: !!user,
  });

  const savedJobs = useMemo(() => filterSavedExternalByTab(savedExternal, 'jobs'), [savedExternal]);
  const savedOffers = useMemo(() => filterSavedExternalByTab(savedExternal, 'offers'), [savedExternal]);
  const savedCampaigns = useMemo(() => filterSavedExternalByTab(savedExternal, 'campaigns'), [savedExternal]);

  const unsaveMutation = useMutation({
    mutationFn: (postId: string) => userExternalFeedService.toggleSave(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'external-feed', 'saved'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'external-feed', 'engagement'] });
      setSelectedExternal(null);
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/events', { replace: true, state: { openAuth: 'login' } });
    }
  }, [user, navigate]);

  if (!user) return null;

  const counts: Record<SavedCollectionTab, number> = {
    news: savedEvents.length,
    jobs: savedJobs.length,
    offers: savedOffers.length,
    campaigns: savedCampaigns.length,
  };

  const listForTab = () => {
    if (tab === 'news') return { items: savedEvents, loading: newsLoading, error: newsError, refetch: refetchNews };
    if (tab === 'jobs') return { items: savedJobs, loading: extLoading, error: extError, refetch: refetchExt };
    if (tab === 'offers') return { items: savedOffers, loading: extLoading, error: extError, refetch: refetchExt };
    return { items: savedCampaigns, loading: extLoading, error: extError, refetch: refetchExt };
  };

  const { items, loading, error, refetch } = listForTab();

  const emptyCopy: Record<SavedCollectionTab, string> = {
    news: 'No saved school news yet. Save posts from your home feed.',
    jobs: 'No saved jobs yet. Use Save job on External job posts.',
    offers: 'No saved offers yet. Bookmark offers from the External feed.',
    campaigns: 'No saved campaigns yet. Bookmark campaigns from the External feed.',
  };

  return (
    <EventsStudentShell activeTab="settings" activeSavedTab={tab} contentClassName="events-student-shell-page">
      {selectedEvent ? (
        <SavedEventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />
      ) : selectedExternal ? (
        <SavedExternalDetail
          row={selectedExternal}
          onBack={() => setSelectedExternal(null)}
          onUnsave={() => unsaveMutation.mutate(selectedExternal.id)}
        />
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
            <h1 className="mb-0 saved-items-page__title">Saved</h1>
          </div>

          <div className="saved-items-tabs saved-items-tabs--scroll" role="tablist" aria-label="Saved collections">
            {(Object.keys(TAB_LABELS) as SavedCollectionTab[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                className={tab === key ? 'is-active' : ''}
                aria-selected={tab === key}
                onClick={() => setTab(key)}
              >
                {TAB_LABELS[key]}
                {counts[key] > 0 ? <span className="saved-items-tabs__count">{counts[key]}</span> : null}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" role="status" />
              <p className="mt-2 mb-0 text-muted small">Loading…</p>
            </div>
          ) : error && items.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted small mb-3">Could not load saved items.</p>
              <button type="button" className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => void refetch()}>
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted text-center py-5 small mb-0">{emptyCopy[tab]}</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {tab === 'news'
                ? savedEvents.map((event: SavedEventItem) => (
                    <SavedEventRow key={event.id} event={event} onSelect={() => setSelectedEvent(event)} />
                  ))
                : (items as SavedExternalPostRow[]).map((row) => (
                    <SavedExternalRow key={row.id} row={row} onSelect={() => setSelectedExternal(row)} />
                  ))}
            </div>
          )}

          {!loading && items.length > 0 ? (
            <div className="text-center mt-3">
              <button type="button" className="btn btn-link btn-sm text-muted" onClick={() => void refetch()}>
                Refresh
              </button>
            </div>
          ) : null}
        </>
      )}
    </EventsStudentShell>
  );
};
