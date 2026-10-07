import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { imageSrc } from '../utils/image';
import {
  EVENT_DESCRIPTION_MAX_WORDS,
  formatEventOccurrenceDate,
  formatEventTimeRange,
  parseEventActionButtonsPublic,
  truncateWords,
  isKnowMoreActionLabel,
  knowMoreActionDisplayLabel,
} from '../utils/eventPostPublic';
import {
  APPLE_CALENDAR_BUTTON_LABEL,
  GOOGLE_CALENDAR_BUTTON_LABEL,
} from './EventPostDetailFields';

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
}: EventPostDetailLayoutProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    setDescExpanded(false);
  }, [description]);

  const hero =
    coverImageUrl ||
    (imageUrls?.[0] ? imageSrc(imageUrls[0]) : '') ||
    '';
  const dateLabel = formatEventOccurrenceDate(eventDate ?? null);
  const timeLabel = formatEventTimeRange(eventStartTime, eventEndTime);
  const location = eventLocation?.trim() || '';
  const trimmedDesc = description.trim();
  const { text: descPreview, truncated: descTruncated } = descExpanded
    ? { text: trimmedDesc, truncated: false }
    : truncateWords(trimmedDesc, EVENT_DESCRIPTION_MAX_WORDS);
  const allButtons = sortActionButtons(
    actionButtons?.length
      ? actionButtons.filter((b) => b.label.trim())
      : parseEventActionButtonsPublic(actionButtonsJson),
  );
  const linkPills = allButtons.filter((b) => isKnowMoreActionLabel(b.label));
  const buttons = allButtons.filter((b) => !isKnowMoreActionLabel(b.label));
  const categoryLabel = [categoryName, subCategoryName].filter(Boolean).join(' · ') || categoryName || '';
  const displayTitle = title.trim() || 'Your post title';

  return (
    <div
      className={`event-post-detail${compact ? ' event-post-detail--compact' : ''}${className ? ` ${className}` : ''}`}
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
      ) : null}

      {categoryLabel ? <span className="event-post-detail__category">{categoryLabel}</span> : null}

      {descPreview ? (
        <p className="event-post-detail__teaser">
          {descPreview}
          {!descExpanded && descTruncated ? '…' : null}
        </p>
      ) : null}
      {descTruncated && !descExpanded ? (
        <div className="event-post-detail__know-more-wrap">
          <button
            type="button"
            className="event-post-detail__know-more"
            onClick={() => setDescExpanded(true)}
          >
            Know more
          </button>
        </div>
      ) : null}

      {linkPills.length > 0 ? (
        <div className="event-post-detail__know-more-wrap">
          {linkPills.map((btn) =>
            preview || !btn.url.trim() ? (
              <span key={`${btn.label}-${btn.url}`} className="event-post-detail__know-more">
                {knowMoreActionDisplayLabel(btn.label)}
              </span>
            ) : (
              <a
                key={`${btn.label}-${btn.url}`}
                href={btn.url}
                target="_blank"
                rel="noopener noreferrer"
                className="event-post-detail__know-more"
              >
                {knowMoreActionDisplayLabel(btn.label)}
              </a>
            ),
          )}
        </div>
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
    </div>
  );
}
