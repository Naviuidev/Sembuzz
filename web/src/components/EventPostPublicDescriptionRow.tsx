import type { ApprovedEventPublic } from '../services/public-events.service';
import { EventPostPublicDescription } from './EventPostPublicDescription';
import { eventPillStyle } from './eventPostPillButton';

type Props = {
  event: Pick<ApprovedEventPublic, 'externalLink'>;
  description: string;
  expanded: boolean;
  onExpand: () => void;
  compact?: boolean;
};

export function EventPostPublicDescriptionRow({ event, description, expanded, onExpand, compact }: Props) {
  const externalLink = event.externalLink?.trim() || null;
  const hasDescription = !!description.trim();

  if (!hasDescription && !externalLink) return null;

  return (
    <div
      className="event-post-desc-row"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: compact ? '0.35rem' : '0.5rem',
        marginBottom: compact ? '0.25rem' : '0.35rem',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {hasDescription ? (
          <EventPostPublicDescription
            description={description}
            expanded={expanded}
            onExpand={onExpand}
            compact={compact}
            embedded
          />
        ) : null}
      </div>
      {externalLink ? (
        <a
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-dark btn-sm rounded-pill flex-shrink-0 text-decoration-none"
          style={{
            ...eventPillStyle(compact, 'dark'),
            marginTop: hasDescription ? 2 : 0,
          }}
        >
          Know more
        </a>
      ) : null}
    </div>
  );
}
