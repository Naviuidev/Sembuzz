import type { ApprovedEventPublic } from '../services/public-events.service';
import {
  formatEventDuration,
  formatEventOccurrenceDateShort,
  formatEventTimeRange,
  parseEventActionButtonsPublic,
  eventPostHasScheduleMeta,
  eventPostHasActionButtons,
} from '../utils/eventPostPublic';
import { eventActionBadgeStyle } from './eventPostPillButton';

type EventFields = Pick<
  ApprovedEventPublic,
  'eventDate' | 'eventStartTime' | 'eventEndTime' | 'eventLocation' | 'actionButtons' | 'externalLink'
>;

type CompactProps = { compact?: boolean };

const MUTED = '#6c757d';
const TEXT = '#1a1f2e';
const DIVIDER = '#dee2e6';

function MetaIcon({ name, size = '1.05rem' }: { name: string; size?: string }) {
  return (
    <i
      className={`bi bi-${name}`}
      aria-hidden
      style={{ fontSize: size, color: MUTED, lineHeight: 1 }}
    />
  );
}

function Sep() {
  return (
    <span style={{ color: DIVIDER, fontWeight: 400, userSelect: 'none' }} aria-hidden>
      |
    </span>
  );
}

function actionButtonIcon(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('google calendar') || l.includes('apple calendar')) return 'calendar-plus';
  if (l.includes('rsvp') || l.includes('register')) return 'box-arrow-up-right';
  return 'link-45deg';
}

/** Date, time, and location on one line; Know more below (replaces “Organized by”). */
export function EventPostPublicMeta({ event, compact }: { event: EventFields } & CompactProps) {
  const dateLabel = formatEventOccurrenceDateShort(event.eventDate ?? null);
  const timeLabel = formatEventTimeRange(event.eventStartTime, event.eventEndTime);
  const durationLabel = formatEventDuration(event.eventStartTime, event.eventEndTime);
  const location = event.eventLocation?.trim() || null;
  const hasSchedule = eventPostHasScheduleMeta(event);

  if (!hasSchedule) return null;

  const fontSize = compact ? '0.875rem' : '0.95rem';
  const iconCol = compact ? 20 : 24;

  return (
    <div
      className="event-post-meta"
      style={{
        marginTop: compact ? '0.5rem' : '0.75rem',
        marginBottom: compact ? '0.5rem' : '0.65rem',
      }}
    >
      {hasSchedule ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: iconCol, flexShrink: 0, paddingTop: 2 }}>
            <MetaIcon name="calendar-event" />
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.35rem 0.65rem',
              fontSize,
              color: TEXT,
              fontWeight: 600,
              lineHeight: 1.45,
            }}
          >
            {dateLabel ? <span>{dateLabel}</span> : null}
            {dateLabel && (timeLabel || location) ? <Sep /> : null}
            {timeLabel ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <MetaIcon name="clock" size="0.95rem" />
                <span>{timeLabel}</span>
                {durationLabel ? (
                  <span style={{ fontWeight: 400, color: MUTED, fontSize: '0.85em' }}>{durationLabel}</span>
                ) : null}
              </span>
            ) : null}
            {timeLabel && location ? <Sep /> : null}
            {location ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <MetaIcon name="geo-alt" size="0.95rem" />
                <span>{location}</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Admin-configured action buttons (after description). */
export function EventPostPublicActionButtons({ event, compact }: { event: EventFields } & CompactProps) {
  const buttons = parseEventActionButtonsPublic(event.actionButtons);
  if (!eventPostHasActionButtons(event)) return null;

  const badge = eventActionBadgeStyle(compact);

  return (
    <div
      className="event-post-actions"
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 10,
        marginTop: compact ? 8 : 10,
        marginBottom: compact ? 4 : 8,
      }}
    >
      {buttons.map((b) => (
        <a
          key={`${b.label}-${b.url}`}
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-decoration-none event-post-action-badge"
          style={badge}
          title={b.label}
        >
          <i className={`bi bi-${actionButtonIcon(b.label)}`} aria-hidden style={{ flexShrink: 0, opacity: 0.85 }} />
          <span>{b.label}</span>
        </a>
      ))}
    </div>
  );
}

/** @deprecated Use EventPostPublicMeta + EventPostPublicActionButtons */
export function EventPostPublicExtras({ event, compact }: { event: EventFields; compact?: boolean }) {
  return (
    <>
      <EventPostPublicMeta event={event} compact={compact} />
      <EventPostPublicActionButtons event={event} compact={compact} />
    </>
  );
}
