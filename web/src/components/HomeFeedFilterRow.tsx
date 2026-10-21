import { useState } from 'react';
import type { CategoryPublic } from '../services/public-events.service';

export type HomeFeedFilterRowProps = {
  showGuestSchoolPicker: boolean;
  showAllSchoolsPicker: boolean;
  schoolPickerLabel: string;
  schoolPickerActive: boolean;
  onOpenSchoolPicker: (target: 'guest' | 'allSchools') => void;
  showCategories: boolean;
  showSortPillsInline: boolean;
  homeContentCategories: CategoryPublic[];
  selectedSubCategoryIds: string[];
  contentExpandedCategoryId: string | null;
  onCategoryClick: (categoryId: string, categoryName: string, isOpen: boolean) => void;
  onClearContentCategoryFilter: () => void;
  feedSort: 'latest' | 'popular';
  onFeedSortChange: (sort: 'latest' | 'popular') => void;
  showHomeFunnel: boolean;
  filterDropdownOpen: boolean;
  onToggleFilterDropdown: () => void;
  filterPanelActive: boolean;
  calendarActive: boolean;
  onOpenCalendarFilter: () => void;
  onOpenSearch: () => void;
};

export function HomeFeedFilterRow({
  showGuestSchoolPicker,
  showAllSchoolsPicker,
  schoolPickerLabel,
  schoolPickerActive,
  onOpenSchoolPicker,
  showCategories,
  showSortPillsInline,
  homeContentCategories,
  selectedSubCategoryIds,
  contentExpandedCategoryId,
  onCategoryClick,
  onClearContentCategoryFilter,
  feedSort,
  onFeedSortChange,
  showHomeFunnel,
  filterDropdownOpen,
  onToggleFilterDropdown,
  filterPanelActive,
  calendarActive,
  onOpenCalendarFilter,
  onOpenSearch,
}: HomeFeedFilterRowProps) {
  const [homeToolsExpanded, setHomeToolsExpanded] = useState(false);

  const homeToolsLayerHighlighted =
    homeToolsExpanded || filterPanelActive || calendarActive;

  const toggleHomeTools = () => {
    setHomeToolsExpanded((open) => {
      if (open && filterDropdownOpen) onToggleFilterDropdown();
      return !open;
    });
  };

  const showCategoryStrip = showCategories || showSortPillsInline;

  return (
    <div className="home-feed-filter-row d-lg-none" role="toolbar" aria-label="Feed filters">
      {showGuestSchoolPicker || showAllSchoolsPicker ? (
        <button
          type="button"
          className={`home-feed-filter-school${schoolPickerActive ? ' is-active' : ''}`}
          onClick={() => onOpenSchoolPicker(showGuestSchoolPicker ? 'guest' : 'allSchools')}
        >
          <i className="bi bi-building" aria-hidden />
          <span className="text-truncate">{schoolPickerLabel}</span>
          <i className="bi bi-chevron-down" aria-hidden />
        </button>
      ) : null}

      {showCategoryStrip ? (
        <div className="home-feed-filter-categories content-categories-scroll">
          {showSortPillsInline ? (
            <>
              <button
                type="button"
                className={`home-feed-filter-pill${feedSort === 'latest' ? ' is-active' : ''}`}
                onClick={() => onFeedSortChange('latest')}
              >
                Latest
              </button>
              <button
                type="button"
                className={`home-feed-filter-pill${feedSort === 'popular' ? ' is-active' : ''}`}
                onClick={() => onFeedSortChange('popular')}
              >
                Popular
              </button>
            </>
          ) : (
            <>
              {showCategories && homeContentCategories.length > 0 ? (
                <>
                  <button
                    type="button"
                    className={`home-feed-filter-pill${
                      selectedSubCategoryIds.length === 0 && !contentExpandedCategoryId
                        ? ' is-selected'
                        : ''
                    }`}
                    onClick={onClearContentCategoryFilter}
                    aria-pressed={
                      selectedSubCategoryIds.length === 0 && !contentExpandedCategoryId
                    }
                  >
                    All
                  </button>
                  {homeContentCategories.map((cat) => {
                    const hasSelection = selectedSubCategoryIds.some((id) =>
                      cat.subcategories.some((s) => s.id === id),
                    );
                    const isOpen = contentExpandedCategoryId === cat.id;
                    const isSelected = hasSelection || isOpen;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`home-feed-filter-pill${isSelected ? ' is-selected' : ''}`}
                        onClick={() => onCategoryClick(cat.id, cat.name, isOpen)}
                        aria-expanded={isOpen}
                        aria-pressed={isSelected}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <div className="home-feed-filter-spacer" aria-hidden />
      )}

      <div className="home-feed-filter-actions">
        <button
          type="button"
          className={`home-feed-filter-icon-btn${homeToolsLayerHighlighted ? ' is-active' : ''}`}
          onClick={toggleHomeTools}
          aria-expanded={homeToolsExpanded}
          aria-label={homeToolsExpanded ? 'Hide filter tools' : 'Show filter tools'}
        >
          <i className={`bi bi-layers${homeToolsExpanded ? '-fill' : ''}`} aria-hidden />
        </button>
        {homeToolsExpanded ? (
          <>
            {showHomeFunnel ? (
              <div className="home-feed-filter-funnel-wrap">
                <button
                  type="button"
                  className={`home-feed-filter-icon-btn${filterPanelActive ? ' is-active' : ''}`}
                  onClick={onToggleFilterDropdown}
                  aria-expanded={filterDropdownOpen}
                  aria-label="Filter"
                >
                  <i className={`bi bi-funnel${filterPanelActive ? '-fill' : ''}`} aria-hidden />
                </button>
                {filterDropdownOpen && !showSortPillsInline ? (
                  <div className="home-feed-filter-dropdown" role="dialog" aria-label="Filter">
                    <div className="home-feed-filter-dropdown-header">
                      <span>Filter</span>
                      <button type="button" className="home-feed-filter-dropdown-close" onClick={onToggleFilterDropdown}>
                        ×
                      </button>
                    </div>
                    <p className="home-feed-filter-dropdown-label">Sort</p>
                    <div className="home-feed-filter-dropdown-pills">
                      <button
                        type="button"
                        className={`home-feed-filter-pill${feedSort === 'latest' ? ' is-active' : ''}`}
                        onClick={() => {
                          onFeedSortChange('latest');
                          onToggleFilterDropdown();
                        }}
                      >
                        Latest
                      </button>
                      <button
                        type="button"
                        className={`home-feed-filter-pill${feedSort === 'popular' ? ' is-active' : ''}`}
                        onClick={() => {
                          onFeedSortChange('popular');
                          onToggleFilterDropdown();
                        }}
                      >
                        Popular
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              className={`home-feed-filter-icon-btn${calendarActive ? ' is-active' : ''}`}
              onClick={onOpenCalendarFilter}
              aria-label="Calendar"
            >
              <i className={`bi bi-calendar-event${calendarActive ? '-fill' : ''}`} aria-hidden />
            </button>
            <button
              type="button"
              className="home-feed-filter-icon-btn"
              onClick={onOpenSearch}
              aria-label="Search"
            >
              <i className="bi bi-search" aria-hidden />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
