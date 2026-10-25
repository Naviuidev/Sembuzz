import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { imageSrc } from '../utils/image';
import {
  eventDateToYmd,
  formatEventDateHeroPillLabel,
  getPostedDateYmd,
  getTodayYmdLocal,
} from '../utils/eventFeedDate';
import {
  EVENT_DESCRIPTION_MAX_WORDS,
  formatEventOccurrenceDate,
  formatEventTimeRange,
  parseEventActionButtonsPublic,
  truncateWords,
  isKnowMoreActionLabel,
  normalizeExternalUrlForOpen,
} from '../utils/eventPostPublic';
import {
  APPLE_CALENDAR_BUTTON_LABEL,
  GOOGLE_CALENDAR_BUTTON_LABEL,
} from './EventPostDetailFields';
import { EventKnowMoreChooserModal } from './EventKnowMoreChooserModal';

export type EventPostDetailLayoutProps = {
  title: string;
  description?: string;
  coverImageUrl?: string | null;
  imageUrls?: string[];
  schoolName?: string;
  schoolLogoUrl?: string | null;
  categoryName?: string;
  subCategoryName?: string;
  eventDate?: string | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  eventLocation?: string | null;
  actionButtons?: { label: string; url: string }[];
  actionButtonsJson?: string | null;
  compact?: boolean;
  showHero?: boolean;
  /** Live preview: decorative hero controls, non-clickable CTAs */
  preview?: boolean;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
  /** e.g. like / save / comment row directly under the hero (public feed) */
  belowHero?: ReactNode;
  /** Home feed: colored date / time / location pills (matches mobile). */
  metaChips?: boolean;
  /** When post was published (shown under description on live feed). */
  postedDateLabel?: string;
  /** Public “Know more” CTA — shown only when this URL is set. */
  externalLink?: string | null;
  /** Admin “Know more link” from create/edit (used for Open source / in-app Know more). */
  adminSourceLink?: string | null;
  /** Light-green date pill on hero (public home feed). */
  showHeroDatePill?: boolean;
  publishedAt?: string | null;
  createdAt?: string | null;
  /** Home feed: Know more opens “source link” vs “within app” chooser. */
  knowMoreChooser?: boolean;
  /** In-app sheet: show full description (no teaser). */
  showFullDescription?: boolean;
  /** Full in-app view: Know more opens source URL directly (no chooser). */
  knowMoreOpensSourceDirectly?: boolean;
};

function schoolBadgeLabel(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase() || 'SB';
}

function sortActionButtons(buttons: { label: string; url: string }[]): { label: string; url: string }[] {
  const rank = (label: string) => {
    if (label === GOOGLE_CALENDAR_BUTTON_LABEL) return 2;
    if (label === APPLE_CALENDAR_BUTTON_LABEL) return 3;
    const l = label.toLowerCase();
    if (l.includes('rsvp') || l.includes('register')) return 0;
    if (l.includes('calendar')) return 4;
    return 1;
  };
  return [...buttons].sort((a, b) => rank(a.label) - rank(b.label));
}

function isPrimaryAction(label: string): boolean {
  if (label === GOOGLE_CALENDAR_BUTTON_LABEL || label === APPLE_CALENDAR_BUTTON_LABEL) return false;
  const l = label.toLowerCase();
  if (l.includes('calendar') && !l.includes('rsvp')) return false;
  return true;
}

function actionIconClass(label: string): string {
  if (label === GOOGLE_CALENDAR_BUTTON_LABEL) return 'bi-google';
  if (label === APPLE_CALENDAR_BUTTON_LABEL) return 'bi-apple';
  const l = label.toLowerCase();
  if (l.includes('rsvp') || l.includes('register')) return 'bi-box-arrow-up-right';
  return 'bi-link-45deg';
}

export function EventPostDetailLayout({
  title,
  description = '',
  coverImageUrl,
  imageUrls,
  schoolName = '',
  schoolLogoUrl,
  categoryName,
  subCategoryName,
  eventDate,
  eventStartTime,
  eventEndTime,
  eventLocation,
  actionButtons,
  actionButtonsJson,
  compact,
  showHero = true,
  preview,
  accentColor = '#3468f9',
  className = '',
  style,
  belowHero,
  metaChips,
  postedDateLabel,
  externalLink,
  adminSourceLink,
  showHeroDatePill,
  publishedAt,
  createdAt,
  knowMoreChooser,
  showFullDescription,
  knowMoreOpensSourceDirectly,
}: EventPostDetailLayoutProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [knowMoreChooserOpen, setKnowMoreChooserOpen] = useState(false);
  const [inAppPostOpen, setInAppPostOpen] = useState(false);

  useEffect(() => {
    setDescExpanded(false);
  }, [description]);

  const feedKnowMoreUrl = externalLink?.trim() ? normalizeExternalUrlForOpen(externalLink.trim()) : '';
  const sourceOpenUrl = adminSourceLink?.trim()
    ? normalizeExternalUrlForOpen(adminSourceLink.trim())
    : feedKnowMoreUrl;
  const showKnowMoreCta = knowMoreOpensSourceDirectly ? !!sourceOpenUrl : !!feedKnowMoreUrl;
  const knowMoreHref = knowMoreOpensSourceDirectly ? sourceOpenUrl : feedKnowMoreUrl;

  const openSourceUrl = () => {
    setKnowMoreChooserOpen(false);
    if (!sourceOpenUrl) {
      window.alert('This post does not have an external source URL.');
      return;
    }
    window.open(sourceOpenUrl, '_blank', 'noopener,noreferrer');
  };

  const openPostWithinApp = () => {
    setKnowMoreChooserOpen(false);
    setInAppPostOpen(true);
  };

  const hero =
    coverImageUrl ||
    (imageUrls?.[0] ? imageSrc(imageUrls[0]) : '') ||
    '';
  const dateLabel = formatEventOccurrenceDate(eventDate ?? null);
  const timeLabel = formatEventTimeRange(eventStartTime, eventEndTime);
  const location = eventLocation?.trim() || '';
  const trimmedDesc = description.trim();
  const { text: descPreview, truncated: descTruncated } =
    showFullDescription || descExpanded
      ? { text: trimmedDesc, truncated: false }
      : truncateWords(trimmedDesc, EVENT_DESCRIPTION_MAX_WORDS);
  const allButtons = sortActionButtons(
    actionButtons?.length
      ? actionButtons.filter((b) => b.label.trim())
      : parseEventActionButtonsPublic(actionButtonsJson),
  );
  const buttons = allButtons.filter((b) => !isKnowMoreActionLabel(b.label));
  const categoryLabel = [categoryName, subCategoryName].filter(Boolean).join(' · ') || categoryName || '';
  const displayTitle = title.trim() || 'Your post title';
  const heroDatePillYmd = showHeroDatePill
    ? eventDateToYmd(eventDate) ??
      getPostedDateYmd({
        eventDate: null,
        publishedAt: publishedAt ?? null,
        createdAt: createdAt ?? '',
      })
    : null;
  const heroDatePillLabel = heroDatePillYmd
    ? formatEventDateHeroPillLabel(heroDatePillYmd, getTodayYmdLocal())
    : null;

  const content = (
    <div
      className={`event-post-detail${compact ? ' event-post-detail--compact' : ''}${metaChips ? ' event-post-detail--meta-chips' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--event-post-accent': accentColor, ...style } as CSSProperties}
    >
      {showHero ? (
        <div className="event-post-detail__hero-wrap">
          {hero ? (
            <img src={hero} alt="" className="event-post-detail__hero" decoding="async" loading="lazy" />
          ) : (
            <div className="event-post-detail__hero event-post-detail__hero--placeholder">
              <i className="bi bi-image" aria-hidden />
            </div>
          )}
          {preview ? (
            <div className="event-post-detail__hero-actions" aria-hidden>
              <span className="event-post-detail__hero-icon-btn">
                <i className="bi bi-heart" />
              </span>
              <span className="event-post-detail__hero-icon-btn">
                <i className="bi bi-share" />
              </span>
            </div>
          ) : null}
          {heroDatePillLabel ? (
            <span className="event-post-detail__hero-date-pill">{heroDatePillLabel}</span>
          ) : null}
          {schoolName || schoolLogoUrl ? (
            <div className="event-post-detail__school-badge">
              {schoolLogoUrl ? (
                <img src={imageSrc(schoolLogoUrl)} alt="" />
              ) : (
                schoolBadgeLabel(schoolName)
              )}
            </div>
          ) : null}
        </div>
      ) : null}
      {belowHero ? <div className="event-post-detail__below-hero">{belowHero}</div> : null}

      <h2 className="event-post-detail__title">{displayTitle}</h2>

      {dateLabel || timeLabel || location ? (
        metaChips ? (
          <div className="event-post-detail__meta-chips-wrap">
            {dateLabel || timeLabel ? (
              <div className="event-post-detail__meta-chips-scroll">
                <div className="event-post-detail__meta-chips-row">
                  {dateLabel ? (
                    <span className="event-post-detail__meta-chip event-post-detail__meta-chip--date">
                      <i className="bi bi-calendar3" aria-hidden />
                      {dateLabel}
                    </span>
                  ) : null}
                  {timeLabel ? (
                    <span className="event-post-detail__meta-chip event-post-detail__meta-chip--time">
                      <i className="bi bi-clock" aria-hidden />
                      {timeLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            {location ? (
              <span className="event-post-detail__meta-chip event-post-detail__meta-chip--location event-post-detail__meta-chip--location-block">
                <i className="bi bi-geo-alt" aria-hidden />
                <span>{location}</span>
              </span>
            ) : null}
          </div>
        ) : (
          <ul className="event-post-detail__meta">
            {dateLabel ? (
              <li>
                <i className="bi bi-calendar3" aria-hidden />
                {dateLabel}
              </li>
            ) : null}
            {timeLabel ? (
              <li>
                <i className="bi bi-clock" aria-hidden />
                {timeLabel}
              </li>
            ) : null}
            {location ? (
              <li>
                <i className="bi bi-geo-alt" aria-hidden />
                {location}
              </li>
            ) : null}
          </ul>
        )
      ) : null}

      {categoryLabel ? <span className="event-post-detail__category">{categoryLabel}</span> : null}

      {descPreview ? (
        <p className="event-post-detail__teaser">
          {descPreview}
          {!descExpanded && descTruncated ? '…' : null}
        </p>
      ) : null}
      {showKnowMoreCta ? (
        <div className="event-post-detail__know-more-wrap">
          {preview ? (
            <span className="event-post-detail__know-more">Know more</span>
          ) : knowMoreChooser && !knowMoreOpensSourceDirectly ? (
            <button
              type="button"
              className="event-post-detail__know-more"
              onClick={(e) => {
                e.stopPropagation();
                setKnowMoreChooserOpen(true);
              }}
            >
              Know more
            </button>
          ) : (
            <a
              href={knowMoreHref}
              target="_blank"
              rel="noopener noreferrer"
              className="event-post-detail__know-more"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(knowMoreHref, '_blank', 'noopener,noreferrer');
              }}
            >
              Know more
            </a>
          )}
        </div>
      ) : null}

      {showFullDescription && postedDateLabel ? (
        <p className="event-post-detail__posted-date">{postedDateLabel}</p>
      ) : null}

      {buttons.length > 0 ? (
        <div className="event-post-detail__actions">
          {buttons.map((btn) => {
            const primary = isPrimaryAction(btn.label);
            const classNames = [
              'event-post-detail__action',
              primary ? 'event-post-detail__action--primary' : 'event-post-detail__action--secondary',
              preview ? 'event-post-detail__action--preview' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const icon = actionIconClass(btn.label);
            if (preview || !btn.url.trim()) {
              return (
                <span key={`${btn.label}-${btn.url}`} className={classNames}>
                  <i className={`bi ${icon}`} aria-hidden />
                  {btn.label || 'Button'}
                </span>
              );
            }
            return (
              <a
                key={`${btn.label}-${btn.url}`}
                href={btn.url}
                target="_blank"
                rel="noopener noreferrer"
                className={classNames}
              >
                <i className={`bi ${icon}`} aria-hidden />
                {btn.label}
              </a>
            );
          })}
        </div>
      ) : null}

      {!showFullDescription && postedDateLabel ? (
        <p className="event-post-detail__posted-date">{postedDateLabel}</p>
      ) : null}
    </div>
  );

  const modals =
    typeof document !== 'undefined'
      ? createPortal(
          <>
            {knowMoreChooser && !knowMoreOpensSourceDirectly ? (
              <EventKnowMoreChooserModal
                open={knowMoreChooserOpen}
                onClose={() => setKnowMoreChooserOpen(false)}
                onOpenSource={openSourceUrl}
                onShowInApp={openPostWithinApp}
              />
            ) : null}
            {inAppPostOpen ? (
              <div
                className="event-post-in-app-overlay"
                role="dialog"
                aria-modal="true"
                onClick={() => setInAppPostOpen(false)}
              >
                <div className="event-post-in-app-sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="event-post-in-app-header">
                    <button type="button" className="event-post-in-app-back" onClick={() => setInAppPostOpen(false)}>
                      <i className="bi bi-arrow-left" aria-hidden />
                      Back
                    </button>
                  </div>
                  <div className="event-post-in-app-scroll">
                    <EventPostDetailLayout
                      title={title}
                      description={description}
                      coverImageUrl={coverImageUrl}
                      imageUrls={imageUrls}
                      schoolName={schoolName}
                      schoolLogoUrl={schoolLogoUrl}
                      categoryName={categoryName}
                      subCategoryName={subCategoryName}
                      eventDate={eventDate}
                      eventStartTime={eventStartTime}
                      eventEndTime={eventEndTime}
                      eventLocation={eventLocation}
                      actionButtons={actionButtons}
                      actionButtonsJson={actionButtonsJson}
                      compact={compact}
                      showHero={showHero}
                      metaChips={metaChips}
                      postedDateLabel={postedDateLabel}
                      externalLink={feedKnowMoreUrl || null}
                      adminSourceLink={adminSourceLink}
                      showHeroDatePill={showHeroDatePill}
                      publishedAt={publishedAt}
                      createdAt={createdAt}
                      showFullDescription
                      knowMoreOpensSourceDirectly
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </>,
          document.body,
        )
      : null;

  return (
    <>
      {content}
      {modals}
    </>
  );
}
