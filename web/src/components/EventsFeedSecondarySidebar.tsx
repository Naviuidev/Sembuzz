import { useState } from 'react';
import type { CategoryPublic, ExternalCategoryPublic } from '../services/public-events.service';

type FeedSort = 'latest' | 'popular';
type LoggedInPostTypeFilter = 'event' | 'posted' | null;

export type EventsFeedSecondarySidebarProps = {
  user: { id: string } | null;
  showSchoolFilterUi: boolean;
  showAllSchoolsFeed: boolean;
  schoolId: string | null;
  selectedGuestSchoolName: string | null;
  allSchoolsFilterSchoolId: string | null;
  selectedAllSchoolsFilterName: string | null;
  feedSort: FeedSort;
  onFeedSortChange: (sort: FeedSort) => void;
  onSignIn: () => void;
  onOpenGuestSchoolPicker: () => void;
  onClearGuestSchool: () => void;
  onOpenAllSchoolsPicker: () => void;
  onClearAllSchoolsFilter: () => void;
  filterPanelOpen: boolean;
  onToggleFilterPanel: () => void;
  filterPanelActive: boolean;
  loggedInFeedPostTypeFilter: LoggedInPostTypeFilter;
  loggedInFeedDateFilter: string | null;
  onLoggedInFeedPostTypeFilter: (mode: LoggedInPostTypeFilter | ((m: LoggedInPostTypeFilter) => LoggedInPostTypeFilter)) => void;
  onLoggedInFeedDateFilter: (value: string | null) => void;
  onClearLoggedInFeedFilters: () => void;
  toYmd: (d: Date) => string;
  calendarActive: boolean;
  onOpenCalendarFilter: () => void;
  homeContentCategories: CategoryPublic[];
  selectedSubCategoryIds: string[];
  contentExpandedCategoryId: string | null;
  onClearContentCategoryFilter: () => void;
  onCategoryClick: (categoryId: string, categoryName: string, isOpen: boolean) => void;
  externalCategories: ExternalCategoryPublic[];
  selectedExternalCategoryId: string | null;
  onExternalCategoryClick: (categoryId: string) => void;
  onClearExternalCategory: () => void;
  schoolExternalEnabled?: boolean;
  allSchoolsFeedActive?: boolean;
  onOpenBookmarks?: () => void;
  onActivateAllSchoolsFeed?: () => void;
};

export function EventsFeedSecondarySidebar({
  user,
  showSchoolFilterUi,
  showAllSchoolsFeed,
  schoolId,
  selectedGuestSchoolName,
  allSchoolsFilterSchoolId,
  selectedAllSchoolsFilterName,
  feedSort,
  onFeedSortChange,
  onSignIn,
  onOpenGuestSchoolPicker,
  onClearGuestSchool,
  onOpenAllSchoolsPicker,
  onClearAllSchoolsFilter,
  filterPanelOpen,
  onToggleFilterPanel,
  filterPanelActive,
  loggedInFeedPostTypeFilter,
  loggedInFeedDateFilter,
  onLoggedInFeedPostTypeFilter,
  onLoggedInFeedDateFilter,
  onClearLoggedInFeedFilters,
  toYmd,
  calendarActive,
  onOpenCalendarFilter,
  homeContentCategories,
  selectedSubCategoryIds,
  contentExpandedCategoryId,
  onClearContentCategoryFilter,
  onCategoryClick,
  externalCategories,
  selectedExternalCategoryId,
  onExternalCategoryClick,
  onClearExternalCategory,
  schoolExternalEnabled = false,
  allSchoolsFeedActive = false,
  onOpenBookmarks,
  onActivateAllSchoolsFeed,
}: EventsFeedSecondarySidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(true);

  const showGuestSchool = !user && showSchoolFilterUi;
  const showAllSchoolsSchoolPicker = !!user && showAllSchoolsFeed && showSchoolFilterUi;
  const showDiscoverQuickLinks = !!user && (onOpenBookmarks || (schoolExternalEnabled && onActivateAllSchoolsFeed));
  const showLoggedInMySchoolFilters = !!user && !showAllSchoolsFeed && showSchoolFilterUi;
  const showMySchoolCategories =
    !!user && !showAllSchoolsFeed && showSchoolFilterUi && homeContentCategories.length > 0;

  return (
    <aside className="events-feed-secondary" aria-label="Feed options">
      <button
        type="button"
        className="events-feed-secondary-mobile-toggle d-lg-none"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
      >
        <i className="bi bi-sliders" aria-hidden />
        <span>Feed options</span>
        <i className={`bi bi-chevron-${mobileOpen ? 'up' : 'down'} ms-auto`} aria-hidden />
      </button>

      <div className={`events-feed-secondary-panel${mobileOpen ? ' is-open' : ''}`}>
        <div className="events-feed-secondary-panel-header d-none d-lg-block">
          <span className="events-feed-secondary-panel-title">Discover</span>
        </div>
        {!user && (
          <div className="events-feed-secondary-card events-feed-secondary-signin events-feed-secondary-section">
            <p className="events-feed-secondary-signin-text">
              Sign in to customize your school feed and join school chat groups.
            </p>
            <button type="button" className="events-feed-secondary-btn events-feed-secondary-btn-primary" onClick={onSignIn}>
              Sign in
            </button>
          </div>
        )}

        {showGuestSchool && (
          <section className="events-feed-secondary-section">
            <h3 className="events-feed-secondary-heading">School</h3>
            <div className="d-flex flex-column gap-2">
              <button
                type="button"
                className={`events-feed-secondary-chip${schoolId ? ' is-active' : ''}`}
                onClick={onOpenGuestSchoolPicker}
              >
                <i className="bi bi-building" aria-hidden />
                <span className="text-truncate">{selectedGuestSchoolName ?? 'Select school'}</span>
                <i className="bi bi-chevron-down ms-auto" aria-hidden />
              </button>
              {schoolId ? (
                <button type="button" className="events-feed-secondary-link" onClick={onClearGuestSchool}>
                  Clear school
                </button>
              ) : null}
            </div>
          </section>
        )}

        {showDiscoverQuickLinks ? (
          <section className="events-feed-secondary-section events-feed-secondary-section--flush-top">
            <div className="d-flex flex-column gap-2">
              {onOpenBookmarks ? (
                <button type="button" className="events-feed-secondary-tool" onClick={onOpenBookmarks}>
                  <i className="bi bi-bookmark" aria-hidden />
                  <span>Bookmarks</span>
                </button>
              ) : null}
              {schoolExternalEnabled && onActivateAllSchoolsFeed ? (
                <button
                  type="button"
                  className={`events-feed-secondary-tool${allSchoolsFeedActive ? ' is-active' : ''}`}
                  onClick={onActivateAllSchoolsFeed}
                >
                  <i className="bi bi-building" aria-hidden />
                  <span>All schools</span>
                </button>
              ) : null}
            </div>
            {showAllSchoolsSchoolPicker ? (
              <div className="d-flex flex-column gap-2 mt-2">
                <button
                  type="button"
                  className={`events-feed-secondary-chip${allSchoolsFilterSchoolId ? ' is-active' : ''}`}
                  onClick={onOpenAllSchoolsPicker}
                >
                  <i className="bi bi-pin-map" aria-hidden />
                  <span className="text-truncate">{selectedAllSchoolsFilterName ?? 'Filter by school'}</span>
                  <i className="bi bi-chevron-down ms-auto" aria-hidden />
                </button>
                {allSchoolsFilterSchoolId ? (
                  <button type="button" className="events-feed-secondary-link" onClick={onClearAllSchoolsFilter}>
                    Clear school filter
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="events-feed-secondary-section">
          <h3 className="events-feed-secondary-heading">Sort</h3>
          <div className="events-feed-secondary-segment" role="group" aria-label="Sort feed">
            <button
              type="button"
              className={feedSort === 'latest' ? 'is-active' : ''}
              onClick={() => onFeedSortChange('latest')}
            >
              Latest
            </button>
            <button
              type="button"
              className={feedSort === 'popular' ? 'is-active' : ''}
              onClick={() => onFeedSortChange('popular')}
            >
              Popular
            </button>
          </div>
        </section>

        {externalCategories.length > 0 && (
          <section className="events-feed-secondary-section">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <h3 className="events-feed-secondary-heading mb-0">External</h3>
              {selectedExternalCategoryId ? (
                <button type="button" className="events-feed-secondary-link" onClick={onClearExternalCategory}>
                  Clear
                </button>
              ) : null}
            </div>
            <div className="events-feed-secondary-category-list">
              {externalCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`events-feed-secondary-category${selectedExternalCategoryId === cat.id ? ' is-active' : ''}`}
                  onClick={() => onExternalCategoryClick(cat.id)}
                  title={cat.description ?? undefined}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {showMySchoolCategories && (
          <section className="events-feed-secondary-section">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <h3 className="events-feed-secondary-heading mb-0">Categories</h3>
              {selectedSubCategoryIds.length > 0 ? (
                <button type="button" className="events-feed-secondary-link" onClick={onClearContentCategoryFilter}>
                  Reset all
                </button>
              ) : null}
            </div>
            <div className="events-feed-secondary-category-list">
              {homeContentCategories.map((cat) => {
                const hasSelection = selectedSubCategoryIds.some((id) =>
                  cat.subcategories.some((s) => s.id === id),
                );
                const isOpen = contentExpandedCategoryId === cat.id;
                const emphasis = hasSelection || isOpen;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`events-feed-secondary-category${emphasis ? ' is-active' : ''}`}
                    onClick={() => onCategoryClick(cat.id, cat.name, isOpen)}
                    aria-expanded={isOpen}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="events-feed-secondary-section">
          <h3 className="events-feed-secondary-heading">Tools</h3>
          <div className="d-flex flex-column gap-2">
            {showSchoolFilterUi && (
              <>
                <button
                  type="button"
                  className={`events-feed-secondary-tool${filterPanelActive ? ' is-active' : ''}`}
                  onClick={onToggleFilterPanel}
                  aria-expanded={filterPanelOpen}
                >
                  <i className="bi bi-funnel" aria-hidden />
                  <span>Filter</span>
                </button>

                {filterPanelOpen && showLoggedInMySchoolFilters ? (
                  <div className="events-feed-secondary-filter-panel">
                    <p className="events-feed-secondary-muted">View by post type</p>
                    <div className="d-flex flex-column gap-2 mb-2">
                      <button
                        type="button"
                        className={`events-feed-secondary-chip-sm${loggedInFeedPostTypeFilter === 'event' ? ' is-active' : ''}`}
                        onClick={() =>
                          onLoggedInFeedPostTypeFilter((m) => (m === 'event' ? null : 'event'))
                        }
                      >
                        Event date
                      </button>
                      <button
                        type="button"
                        className={`events-feed-secondary-chip-sm${loggedInFeedPostTypeFilter === 'posted' ? ' is-active' : ''}`}
                        onClick={() =>
                          onLoggedInFeedPostTypeFilter((m) => (m === 'posted' ? null : 'posted'))
                        }
                      >
                        Post date
                      </button>
                    </div>
                    {loggedInFeedPostTypeFilter ? (
                      <>
                        <label className="events-feed-secondary-muted" htmlFor="events-sidebar-feed-date">
                          Date
                        </label>
                        <input
                          id="events-sidebar-feed-date"
                          type="date"
                          className="form-control form-control-sm mb-2"
                          value={loggedInFeedDateFilter ?? ''}
                          onChange={(e) => onLoggedInFeedDateFilter(e.target.value.trim() || null)}
                        />
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="events-feed-secondary-chip-sm"
                            onClick={() => onLoggedInFeedDateFilter(toYmd(new Date()))}
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            className="events-feed-secondary-chip-sm"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 1);
                              onLoggedInFeedDateFilter(toYmd(d));
                            }}
                          >
                            Tomorrow
                          </button>
                          {(loggedInFeedDateFilter || loggedInFeedPostTypeFilter) && (
                            <button type="button" className="events-feed-secondary-link" onClick={onClearLoggedInFeedFilters}>
                              Clear
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="events-feed-secondary-muted mb-0">Choose a post type, then pick a date.</p>
                    )}
                  </div>
                ) : null}
              </>
            )}

            <button
              type="button"
              className={`events-feed-secondary-tool${calendarActive ? ' is-active' : ''}`}
              onClick={onOpenCalendarFilter}
            >
              <i className="bi bi-calendar3" aria-hidden />
              <span>Calendar</span>
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
