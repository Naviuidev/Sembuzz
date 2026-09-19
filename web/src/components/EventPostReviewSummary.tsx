import {
  formatEventOccurrenceDate,
  formatEventTimeRange,
  parseEventActionButtonsPublic,
} from '../utils/eventPostPublic';

export type EventPostReviewFields = {
  eventDate?: string | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  eventLocation?: string | null;
  actionButtons?: string | null;
  externalLink?: string | null;
};

type Props = {
  event: EventPostReviewFields;
  className?: string;
};

export function hasEventPostReviewContent(event: EventPostReviewFields): boolean {
  const dateLabel = formatEventOccurrenceDate(event.eventDate ?? null);
  const timeLabel = formatEventTimeRange(event.eventStartTime, event.eventEndTime);
  const location = event.eventLocation?.trim() || null;
  const buttons = parseEventActionButtonsPublic(event.actionButtons);
  const externalLink = event.externalLink?.trim() || null;
  return !!(dateLabel || timeLabel || location || externalLink || buttons.length > 0);
}

/** Read-only summary for category admin review (pending approval). */
export function EventPostReviewSummary({ event, className }: Props) {
  const dateLabel = formatEventOccurrenceDate(event.eventDate ?? null);
  const timeLabel = formatEventTimeRange(event.eventStartTime, event.eventEndTime);
  const location = event.eventLocation?.trim() || null;
  const buttons = parseEventActionButtonsPublic(event.actionButtons);
  const externalLink = event.externalLink?.trim() || null;

  const hasOccurrence = !!(dateLabel || timeLabel || location);
  const hasLinks = !!(externalLink || buttons.length > 0);

  if (!hasOccurrence && !hasLinks) return null;

  return (
    <div className={className}>
      {hasOccurrence ? (
        <div className="mb-2">
          <strong style={{ color: '#1a1f2e' }}>When &amp; where</strong>
          <ul className="mb-0 ps-3 small" style={{ color: '#495057' }}>
            {dateLabel ? <li>{dateLabel}</li> : null}
            {timeLabel ? <li>{timeLabel}</li> : null}
            {location ? <li>{location}</li> : null}
          </ul>
        </div>
      ) : null}

      {hasLinks ? (
        <div className="mb-0">
          <strong style={{ color: '#1a1f2e' }}>Links &amp; actions</strong>
          <ul className="mb-0 ps-3 small">
            {externalLink ? (
              <li>
                <a href={externalLink} target="_blank" rel="noopener noreferrer">
                  External link
                </a>
              </li>
            ) : null}
            {buttons.map((b) => (
              <li key={`${b.label}-${b.url}`}>
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  {b.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
