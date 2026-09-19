import { EVENT_DESCRIPTION_MAX_WORDS, truncateWords } from '../utils/eventPostPublic';

type Props = {
  description: string;
  expanded: boolean;
  onExpand: () => void;
  compact?: boolean;
  /** Inside description + Know more row (no extra top margin). */
  embedded?: boolean;
};

export function EventPostPublicDescription({ description, expanded, onExpand, compact, embedded }: Props) {
  const trimmed = description.trim();
  if (!trimmed) return null;

  const { text, truncated } = expanded
    ? { text: trimmed, truncated: false }
    : truncateWords(trimmed, EVENT_DESCRIPTION_MAX_WORDS);

  return (
    <div
      style={{
        fontSize: compact ? '0.9rem' : '0.95rem',
        color: '#495057',
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        marginTop: embedded ? 0 : compact ? '0.35rem' : '0.5rem',
      }}
    >
      {text}
      {truncated ? (
        <button
          type="button"
          className="btn btn-link p-0 ms-1"
          style={{ color: '#0d6efd', fontSize: 'inherit', verticalAlign: 'baseline' }}
          onClick={onExpand}
        >
          Read more
        </button>
      ) : null}
    </div>
  );
}
