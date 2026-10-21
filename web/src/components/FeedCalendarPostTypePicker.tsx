import {
  FEED_CALENDAR_FILTER_EVENT_LABEL,
  FEED_CALENDAR_FILTER_POSTED_LABEL,
} from '../utils/feedCalendarFilterCopy';

type PostType = 'event' | 'posted';

type Props = {
  value: PostType | null;
  onChange: (mode: PostType) => void;
};

export function FeedCalendarPostTypePicker({ value, onChange }: Props) {
  return (
    <div className="d-flex flex-column gap-2 mb-3">
      <button
        type="button"
        className={`feed-calendar-post-type-option${value === 'event' ? ' is-active' : ''}`}
        onClick={() => onChange('event')}
      >
        {FEED_CALENDAR_FILTER_EVENT_LABEL}
      </button>
      <button
        type="button"
        className={`feed-calendar-post-type-option${value === 'posted' ? ' is-active' : ''}`}
        onClick={() => onChange('posted')}
      >
        {FEED_CALENDAR_FILTER_POSTED_LABEL}
      </button>
    </div>
  );
}
