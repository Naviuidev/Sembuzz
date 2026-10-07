import { useMemo, useState, type ReactNode } from 'react';
import type { ExternalPostRequestRow } from '../services/external-admin-post-requests.service';
import type { ApprovedEventPublic, ExternalCategoryPublic } from '../services/public-events.service';
import { ExternalPublicPostCard } from './ExternalPublicPostCard';
import { imageSrc } from '../utils/image';

const LATEST_NEWS_DAYS = 14;
const LATEST_NEWS_FALLBACK_COUNT = 15;

type AccordionId = 'latest' | 'all' | 'external';

function eventSortTime(event: ApprovedEventPublic): number {
  const raw = event.publishedAt ?? event.publishAt ?? event.createdAt;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export type EventsSearchSchoolOption = {
  id: string;
  name: string;
  image: string | null;
};

function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function formatPostDate(event: ApprovedEventPublic): string | null {
  const raw = event.publishedAt ?? event.publishAt ?? event.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function filterSchoolEventsCombined(
  events: ApprovedEventPublic[],
  globalQuery: string,
  localQuery: string,
  subCategoryId: string | null,
): ApprovedEventPublic[] {
  let list = filterSchoolEvents(events, globalQuery, subCategoryId);
  if (localQuery.trim()) {
    list = filterSchoolEvents(list, localQuery, null);
  }
  return list;
}

function filterExternalPostsCombined(
  posts: ExternalPostRequestRow[],
  globalQuery: string,
  localQuery: string,
  categoryId: string | null,
): ExternalPostRequestRow[] {
  let list = filterExternalPosts(posts, globalQuery, categoryId);
  if (localQuery.trim()) {
    list = filterExternalPosts(list, localQuery, null);
  }
  return list;
}

function filterSchoolEvents(
  events: ApprovedEventPublic[],
  query: string,
  subCategoryId: string | null,
): ApprovedEventPublic[] {
  let list = events;
  if (subCategoryId) {
    list = list.filter((e) => e.subCategory?.id === subCategoryId);
  }
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q) ?? false) ||
      (e.school?.name?.toLowerCase().includes(q) ?? false) ||
      (e.subCategory?.name?.toLowerCase().includes(q) ?? false),
  );
}

function filterExternalPosts(
  posts: ExternalPostRequestRow[],
  query: string,
  categoryId: string | null,
): ExternalPostRequestRow[] {
  let list = posts;
  if (categoryId) {
    list = list.filter((p) => p.externalCategory?.id === categoryId);
  }
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q) ?? false) ||
      (p.companyName?.toLowerCase().includes(q) ?? false) ||
      (p.externalCategory?.name?.toLowerCase().includes(q) ?? false),
  );
}

function subCategoryOptions(events: ApprovedEventPublic[]) {
  const map = new Map<string, string>();
  for (const e of events) {
    if (e.subCategory?.id) map.set(e.subCategory.id, e.subCategory.name);
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function SearchResultSkeleton() {
  return (
    <div className="events-search-result-skeleton" aria-hidden>
      <div className="events-search-result-skeleton__thumb" />
      <div className="events-search-result-skeleton__body">
        <div className="events-search-result-skeleton__line events-search-result-skeleton__line--title" />
        <div className="events-search-result-skeleton__line events-search-result-skeleton__line--sub" />
      </div>
    </div>
  );
}

function SearchResultRow({
  event,
  onSelect,
}: {
  event: ApprovedEventPublic;
  onSelect: () => void;
}) {
  const schoolLogo = event.school?.image ?? null;
  const schoolLogoUrl = schoolLogo ? imageSrc(schoolLogo) : '';
  const thumb = parseImageUrls(event.imageUrls)[0];
  const thumbUrl = thumb ? imageSrc(thumb) : '';
  const dateStr = formatPostDate(event);

  return (
    <button type="button" className="events-search-result-row" onClick={onSelect}>
      <span className="events-search-result-row__media">
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="events-search-result-row__thumb" />
        ) : schoolLogoUrl ? (
          <img src={schoolLogoUrl} alt="" className="events-search-result-row__thumb events-search-result-row__thumb--logo" />
        ) : (
          <span className="events-search-result-row__thumb-fallback">
            <i className="bi bi-image" aria-hidden />
          </span>
        )}
      </span>
      <span className="events-search-result-row__body">
        <span className="events-search-result-row__title">{event.title}</span>
        <span className="events-search-result-row__meta">
          <span>{event.school?.name ?? 'School'}</span>
          {event.subCategory?.name ? (
            <>
              <span className="events-search-result-row__dot" aria-hidden>·</span>
              <span>{event.subCategory.name}</span>
            </>
          ) : null}
          {dateStr ? (
            <>
              <span className="events-search-result-row__dot" aria-hidden>·</span>
              <span>{dateStr}</span>
            </>
          ) : null}
        </span>
      </span>
      <i className="bi bi-chevron-right events-search-result-row__chevron" aria-hidden />
    </button>
  );
}

function ExternalResultRow({ row, onSelect }: { row: ExternalPostRequestRow; onSelect: () => void }) {
  const images = parseImageUrls(row.imageUrls ?? null);
  const thumbUrl = images[0] ? imageSrc(images[0]) : '';
  const logoUrl = row.companyLogoUrl ? imageSrc(row.companyLogoUrl) : '';

  return (
    <button type="button" className="events-search-result-row" onClick={onSelect}>
      <span className="events-search-result-row__media">
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="events-search-result-row__thumb" />
        ) : logoUrl ? (
          <img src={logoUrl} alt="" className="events-search-result-row__thumb events-search-result-row__thumb--logo" />
        ) : (
          <span className="events-search-result-row__thumb-fallback">
            <i className="bi bi-briefcase" aria-hidden />
          </span>
        )}
      </span>
      <span className="events-search-result-row__body">
        <span className="events-search-result-row__title">{row.title}</span>
        <span className="events-search-result-row__meta">
          <span>{row.externalCategory?.name ?? 'External'}</span>
          {row.companyName ? (
            <>
              <span className="events-search-result-row__dot" aria-hidden>·</span>
              <span>{row.companyName}</span>
            </>
          ) : null}
        </span>
      </span>
      <i className="bi bi-chevron-right events-search-result-row__chevron" aria-hidden />
    </button>
  );
}

function AccordionPanelToolbar({
  query,
  onQueryChange,
  queryPlaceholder,
  filterLabel,
  filterValue,
  filterOptions,
  onFilterChange,
  onOpenAdvancedFilter,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  queryPlaceholder: string;
  filterLabel: string;
  filterValue: string;
  filterOptions: { id: string; name: string }[];
  onFilterChange: (id: string) => void;
  onOpenAdvancedFilter?: () => void;
}) {
  return (
    <div className="events-search-panel-tools">
      <label className="events-search-bar events-search-bar--compact">
        <i className="bi bi-search events-search-bar__icon" aria-hidden />
        <input
          type="search"
          className="events-search-bar__input"
          placeholder={queryPlaceholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search in section"
        />
        {query.trim() ? (
          <button type="button" className="events-search-bar__clear" onClick={() => onQueryChange('')} aria-label="Clear">
            <i className="bi bi-x-lg" aria-hidden />
          </button>
        ) : null}
      </label>
      <div className="events-search-panel-tools__filter-row">
        <label className="events-search-panel-filter">
          <span className="events-search-panel-filter__label">{filterLabel}</span>
          <select
            className="events-search-panel-filter__select"
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="">All</option>
            {filterOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </label>
        {onOpenAdvancedFilter ? (
          <button type="button" className="events-search-panel-filter-btn" onClick={onOpenAdvancedFilter} aria-label="More filters">
            <i className="bi bi-sliders2" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

type Props = {
  events: ApprovedEventPublic[];
  eventsLoading: boolean;
  schoolPickerOpen: boolean;
  onOpenSchoolPicker: () => void;
  onCloseSchoolPicker: () => void;
  onClearSchool: () => void;
  searchScreenSchoolId: string | null;
  selectedSchoolName: string | null;
  schools: EventsSearchSchoolOption[];
  schoolsLoading: boolean;
  onSelectSchool: (id: string) => void;
  showNoNewsNotice: boolean;
  onDismissNoNewsNotice: () => void;
  selectedEvent: ApprovedEventPublic | null;
  onSelectEvent: (event: ApprovedEventPublic | null) => void;
  renderEventCard: (event: ApprovedEventPublic) => ReactNode;
  onOpenFilterMenu: () => void;
  showExternalSection: boolean;
  externalSignedIn: boolean;
  onExternalSignIn: () => void;
  externalPosts: ExternalPostRequestRow[];
  externalCategories: ExternalCategoryPublic[];
  externalLoading: boolean;
};

export function EventsSearchScreen({
  events,
  eventsLoading,
  schoolPickerOpen,
  onOpenSchoolPicker,
  onCloseSchoolPicker,
  onClearSchool,
  searchScreenSchoolId,
  selectedSchoolName,
  schools,
  schoolsLoading,
  onSelectSchool,
  showNoNewsNotice,
  onDismissNoNewsNotice,
  selectedEvent,
  onSelectEvent,
  renderEventCard,
  onOpenFilterMenu,
  showExternalSection,
  externalSignedIn,
  onExternalSignIn,
  externalPosts,
  externalCategories,
  externalLoading,
}: Props) {
  const [openAccordionIds, setOpenAccordionIds] = useState<Set<AccordionId>>(() => new Set());
  const [globalQuery, setGlobalQuery] = useState('');

  const [latestQuery, setLatestQuery] = useState('');
  const [allQuery, setAllQuery] = useState('');
  const [externalQuery, setExternalQuery] = useState('');
  const [latestSubFilter, setLatestSubFilter] = useState('');
  const [allSubFilter, setAllSubFilter] = useState('');
  const [externalCategoryFilter, setExternalCategoryFilter] = useState('');

  const [selectedExternalPost, setSelectedExternalPost] = useState<ExternalPostRequestRow | null>(null);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => eventSortTime(b) - eventSortTime(a)),
    [events],
  );

  const latestBaseEvents = useMemo(() => {
    const cutoff = Date.now() - LATEST_NEWS_DAYS * 24 * 60 * 60 * 1000;
    const recent = sortedEvents.filter((e) => eventSortTime(e) >= cutoff);
    if (recent.length > 0) return recent;
    return sortedEvents.slice(0, LATEST_NEWS_FALLBACK_COUNT);
  }, [sortedEvents]);

  const latestFiltered = useMemo(
    () => filterSchoolEventsCombined(latestBaseEvents, globalQuery, latestQuery, latestSubFilter || null),
    [latestBaseEvents, globalQuery, latestQuery, latestSubFilter],
  );

  const allFiltered = useMemo(
    () => filterSchoolEventsCombined(sortedEvents, globalQuery, allQuery, allSubFilter || null),
    [sortedEvents, globalQuery, allQuery, allSubFilter],
  );

  const externalFiltered = useMemo(
    () =>
      filterExternalPostsCombined(
        externalPosts,
        globalQuery,
        externalQuery,
        externalCategoryFilter || null,
      ),
    [externalPosts, globalQuery, externalQuery, externalCategoryFilter],
  );

  const globalLatestCount = useMemo(
    () => filterSchoolEvents(latestBaseEvents, globalQuery, null).length,
    [latestBaseEvents, globalQuery],
  );
  const globalAllCount = useMemo(
    () => filterSchoolEvents(sortedEvents, globalQuery, null).length,
    [sortedEvents, globalQuery],
  );
  const globalExternalCount = useMemo(
    () => filterExternalPosts(externalPosts, globalQuery, null).length,
    [externalPosts, globalQuery],
  );

  const latestSubOptions = useMemo(() => subCategoryOptions(latestBaseEvents), [latestBaseEvents]);
  const allSubOptions = useMemo(() => subCategoryOptions(sortedEvents), [sortedEvents]);

  const externalCategoryOptions = useMemo(() => {
    const fromApi = externalCategories.map((c) => ({ id: c.id, name: c.name }));
    if (fromApi.length > 0) return fromApi;
    const map = new Map<string, string>();
    for (const p of externalPosts) {
      if (p.externalCategory?.id) map.set(p.externalCategory.id, p.externalCategory.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [externalCategories, externalPosts]);

  const resultLabel = searchScreenSchoolId
    ? `${events.length} at ${selectedSchoolName ?? 'school'}`
    : `${events.length} across SemBuzz`;

  const toggleAccordion = (id: AccordionId) => {
    setOpenAccordionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAccordion = (id: AccordionId) => {
    setOpenAccordionIds((prev) => new Set(prev).add(id));
  };

  const globalTrimmed = globalQuery.trim();
  const globalTotalMatches =
    globalLatestCount + globalAllCount + (showExternalSection && externalSignedIn ? globalExternalCount : 0);

  if (selectedEvent) {
    return (
      <div className="events-search">
        <div className="events-search-detail-bar">
          <button type="button" className="events-search-back" onClick={() => onSelectEvent(null)}>
            <i className="bi bi-arrow-left" aria-hidden />
            <span>Latest news</span>
          </button>
        </div>
        <div className="events-search-detail-card">{renderEventCard(selectedEvent)}</div>
      </div>
    );
  }

  if (selectedExternalPost) {
    return (
      <div className="events-search">
        <div className="events-search-detail-bar">
          <button type="button" className="events-search-back" onClick={() => setSelectedExternalPost(null)}>
            <i className="bi bi-arrow-left" aria-hidden />
            <span>External</span>
          </button>
        </div>
        <div className="events-search-detail-card events-search-detail-card--external">
          <ExternalPublicPostCard row={selectedExternalPost} />
        </div>
      </div>
    );
  }

  const renderSchoolList = (list: ApprovedEventPublic[], loading: boolean, useFullCards: boolean) => {
    if (loading) {
      return (
        <div className="events-search-results-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <SearchResultSkeleton key={i} />
          ))}
        </div>
      );
    }
    if (list.length === 0) {
      return <p className="events-search-accordion__empty">No posts match your search or filter.</p>;
    }
    if (useFullCards) {
      return (
        <div className="events-search-cards-stack">
          {list.map((event) => (
            <div key={event.id} className="events-search-full-card-wrap">
              {renderEventCard(event)}
            </div>
          ))}
        </div>
      );
    }
    return (
      <ul className="events-search-results-list events-search-results-list--in-accordion">
        {list.map((event) => (
          <li key={event.id}>
            <SearchResultRow event={event} onSelect={() => onSelectEvent(event)} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="events-search">
      <header className="events-search-hero">
        <div className="events-search-hero__glow" aria-hidden />
        <p className="events-search-hero__eyebrow">Explore</p>
        <h1 className="events-search-hero__title">Search campus news</h1>
        <p className="events-search-hero__subtitle">Open a section below to search school news, all posts, or external offers.</p>
      </header>

      <div className="events-search-global">
        <div className="events-search-bar-wrap events-search-bar-wrap--global">
          <label className="events-search-bar events-search-bar--global">
            <i className="bi bi-search events-search-bar__icon" aria-hidden />
            <input
              type="search"
              className="events-search-bar__input"
              placeholder="Search school news, all posts, external jobs & offers…"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              aria-label="Search everything"
              autoComplete="off"
            />
            {globalTrimmed ? (
              <button
                type="button"
                className="events-search-bar__clear"
                onClick={() => setGlobalQuery('')}
                aria-label="Clear global search"
              >
                <i className="bi bi-x-lg" aria-hidden />
              </button>
            ) : null}
          </label>
          <button
            type="button"
            className="events-search-filter-btn"
            onClick={onOpenFilterMenu}
            aria-label="More filters"
          >
            <i className="bi bi-sliders2" aria-hidden />
          </button>
        </div>

        {globalTrimmed ? (
          <div className="events-search-global-preview" role="status">
            <p className="events-search-global-preview__lead">
              {globalTotalMatches === 0
                ? `No results for “${globalTrimmed}”`
                : `${globalTotalMatches} result${globalTotalMatches === 1 ? '' : 's'} for “${globalTrimmed}”`}
            </p>
            <div className="events-search-global-preview__actions">
              <button
                type="button"
                className="events-search-global-preview__chip"
                disabled={globalLatestCount === 0}
                onClick={() => openAccordion('latest')}
              >
                Latest news
                <span className="events-search-global-preview__count">{globalLatestCount}</span>
              </button>
              <button
                type="button"
                className="events-search-global-preview__chip"
                disabled={globalAllCount === 0}
                onClick={() => openAccordion('all')}
              >
                All posts
                <span className="events-search-global-preview__count">{globalAllCount}</span>
              </button>
              {showExternalSection ? (
                <button
                  type="button"
                  className="events-search-global-preview__chip"
                  disabled={!externalSignedIn || globalExternalCount === 0}
                  onClick={() => {
                    if (!externalSignedIn) {
                      onExternalSignIn();
                      return;
                    }
                    openAccordion('external');
                  }}
                >
                  External
                  <span className="events-search-global-preview__count">
                    {externalSignedIn ? globalExternalCount : '—'}
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="events-search-global-hint">Tip: use the global search here, then refine inside each section.</p>
        )}
      </div>

      <div className="events-search-chips" role="toolbar" aria-label="School scope">
        <button
          type="button"
          className={`events-search-chip${!searchScreenSchoolId ? ' is-active' : ''}`}
          onClick={() => {
            onClearSchool();
            if (schoolPickerOpen) onCloseSchoolPicker();
          }}
        >
          <i className="bi bi-globe2" aria-hidden />
          All schools
        </button>
        <button
          type="button"
          className={`events-search-chip${searchScreenSchoolId || schoolPickerOpen ? ' is-active' : ''}`}
          onClick={onOpenSchoolPicker}
        >
          <i className="bi bi-building" aria-hidden />
          {selectedSchoolName ? selectedSchoolName : 'Pick a school'}
        </button>
      </div>

      {schoolPickerOpen ? (
        <section className="events-search-school-panel" aria-label="Select a school">
          <div className="events-search-school-panel__head">
            <h2 className="events-search-school-panel__title">Schools on SemBuzz</h2>
            <div className="events-search-school-panel__actions">
              {searchScreenSchoolId ? (
                <button type="button" className="events-search-link-btn" onClick={onClearSchool}>
                  Show all
                </button>
              ) : null}
              <button
                type="button"
                className="events-search-link-btn"
                onClick={() => {
                  onCloseSchoolPicker();
                  onSelectEvent(null);
                }}
              >
                Done
              </button>
            </div>
          </div>
          {schoolsLoading ? (
            <div className="events-search-school-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="events-search-school-card events-search-school-card--skeleton" />
              ))}
            </div>
          ) : schools.length === 0 ? (
            <p className="events-search-empty-copy">No schools found.</p>
          ) : (
            <div className="events-search-school-grid">
              {schools.map((s) => {
                const logoUrl = s.image ? imageSrc(s.image) : '';
                const isSelected = searchScreenSchoolId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`events-search-school-card${isSelected ? ' is-selected' : ''}`}
                    onClick={() => onSelectSchool(s.id)}
                  >
                    <span className="events-search-school-card__logo">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <i className="bi bi-building" aria-hidden />
                      )}
                    </span>
                    <span className="events-search-school-card__name">{s.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {showNoNewsNotice && searchScreenSchoolId ? (
            <div className="events-search-notice" role="status">
              <div className="events-search-notice__icon">
                <i className="bi bi-newspaper" aria-hidden />
              </div>
              <div>
                <p className="events-search-notice__title">News coming soon</p>
                <p className="events-search-notice__text">
                  Approved posts from this school will show up here. Sign in to like, comment, and save stories.
                </p>
              </div>
              <button type="button" className="events-search-notice__ok" onClick={onDismissNoNewsNotice}>
                Got it
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="events-search-results" aria-live="polite">
          <div className="events-search-results__head">
            <span className="events-search-results__badge">{resultLabel}</span>
          </div>

          <div className="events-search-accordion events-search-accordion--stack">
            <div className="events-search-accordion__item">
              <button
                type="button"
                className="events-search-accordion__trigger"
                aria-expanded={openAccordionIds.has('latest')}
                onClick={() => toggleAccordion('latest')}
              >
                <span className="events-search-accordion__trigger-main">
                  <i className="bi bi-lightning-charge events-search-accordion__trigger-icon" aria-hidden />
                  <span>
                    Latest news
                    <span className="events-search-accordion__meta">Last {LATEST_NEWS_DAYS} days · {latestBaseEvents.length} posts</span>
                  </span>
                </span>
                <i className={`bi bi-chevron-${openAccordionIds.has('latest') ? 'up' : 'down'}`} aria-hidden />
              </button>
              {openAccordionIds.has('latest') ? (
                <div className="events-search-accordion__panel">
                  <AccordionPanelToolbar
                    query={latestQuery}
                    onQueryChange={setLatestQuery}
                    queryPlaceholder="Search latest news…"
                    filterLabel="Category"
                    filterValue={latestSubFilter}
                    filterOptions={latestSubOptions}
                    onFilterChange={setLatestSubFilter}
                    onOpenAdvancedFilter={onOpenFilterMenu}
                  />
                  {renderSchoolList(latestFiltered, eventsLoading, !!searchScreenSchoolId)}
                </div>
              ) : null}
            </div>

            <div className="events-search-accordion__item">
              <button
                type="button"
                className="events-search-accordion__trigger"
                aria-expanded={openAccordionIds.has('all')}
                onClick={() => toggleAccordion('all')}
              >
                <span className="events-search-accordion__trigger-main">
                  <i className="bi bi-collection events-search-accordion__trigger-icon" aria-hidden />
                  <span>
                    All
                    <span className="events-search-accordion__meta">{sortedEvents.length} school posts</span>
                  </span>
                </span>
                <i className={`bi bi-chevron-${openAccordionIds.has('all') ? 'up' : 'down'}`} aria-hidden />
              </button>
              {openAccordionIds.has('all') ? (
                <div className="events-search-accordion__panel">
                  <AccordionPanelToolbar
                    query={allQuery}
                    onQueryChange={setAllQuery}
                    queryPlaceholder="Search all news…"
                    filterLabel="Category"
                    filterValue={allSubFilter}
                    filterOptions={allSubOptions}
                    onFilterChange={setAllSubFilter}
                    onOpenAdvancedFilter={onOpenFilterMenu}
                  />
                  {renderSchoolList(allFiltered, eventsLoading, !!searchScreenSchoolId)}
                </div>
              ) : null}
            </div>

            {showExternalSection ? (
              <div className="events-search-accordion__item">
                <button
                  type="button"
                  className="events-search-accordion__trigger"
                  aria-expanded={openAccordionIds.has('external')}
                  onClick={() => toggleAccordion('external')}
                >
                  <span className="events-search-accordion__trigger-main">
                    <i className="bi bi-box-arrow-up-right events-search-accordion__trigger-icon" aria-hidden />
                    <span>
                      External
                      <span className="events-search-accordion__meta">Jobs, offers &amp; campaigns</span>
                    </span>
                  </span>
                  <i className={`bi bi-chevron-${openAccordionIds.has('external') ? 'up' : 'down'}`} aria-hidden />
                </button>
                {openAccordionIds.has('external') ? (
                  <div className="events-search-accordion__panel">
                    {!externalSignedIn ? (
                      <div className="events-search-panel-signin">
                        <p className="events-search-empty-copy mb-2">Sign in to browse external posts for your school.</p>
                        <button type="button" className="events-search-empty__action" onClick={onExternalSignIn}>
                          Sign in
                        </button>
                      </div>
                    ) : (
                      <>
                        <AccordionPanelToolbar
                          query={externalQuery}
                          onQueryChange={setExternalQuery}
                          queryPlaceholder="Search jobs, offers, campaigns…"
                          filterLabel="Type"
                          filterValue={externalCategoryFilter}
                          filterOptions={externalCategoryOptions}
                          onFilterChange={setExternalCategoryFilter}
                        />
                        {externalLoading ? (
                          <div className="events-search-results-list">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <SearchResultSkeleton key={i} />
                            ))}
                          </div>
                        ) : externalFiltered.length === 0 ? (
                          <p className="events-search-accordion__empty">No external posts match your search.</p>
                        ) : (
                          <ul className="events-search-results-list events-search-results-list--in-accordion">
                            {externalFiltered.map((row) => (
                              <li key={row.id}>
                                <ExternalResultRow row={row} onSelect={() => setSelectedExternalPost(row)} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
