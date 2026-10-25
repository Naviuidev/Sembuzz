import type { ApprovedEventPublic } from '../services/public-events.service';
import { getEventKnowMoreUrl, parseEventImageUrls } from '../utils/eventPostPublic';
import { EventPostDetailLayout } from './EventPostDetailLayout';

type EventFields = Pick<
  ApprovedEventPublic,
  | 'title'
  | 'description'
  | 'eventDate'
  | 'eventStartTime'
  | 'eventEndTime'
  | 'eventLocation'
  | 'actionButtons'
  | 'externalLink'
  | 'imageUrls'
  | 'school'
  | 'subCategory'
>;

export function EventPostPublicContent({
  event,
  description,
  compact,
  showHero = false,
  knowMoreChooser = false,
}: {
  event: EventFields;
  description?: string;
  compact?: boolean;
  showHero?: boolean;
  knowMoreChooser?: boolean;
}) {
  const schoolName = event.school?.name ?? '';
  const schoolLogoUrl = event.school?.image ?? null;
  const desc = description ?? event.description ?? '';

  return (
    <EventPostDetailLayout
      title={event.title}
      description={desc}
      imageUrls={parseEventImageUrls(event.imageUrls)}
      schoolName={schoolName}
      schoolLogoUrl={schoolLogoUrl}
      categoryName={event.subCategory?.name ?? ''}
      eventDate={event.eventDate}
      eventStartTime={event.eventStartTime}
      eventEndTime={event.eventEndTime}
      eventLocation={event.eventLocation}
      actionButtonsJson={event.actionButtons}
      externalLink={getEventKnowMoreUrl(event)}
      adminSourceLink={event.externalLink}
      compact={compact}
      showHero={showHero}
      knowMoreChooser={knowMoreChooser}
    />
  );
}
