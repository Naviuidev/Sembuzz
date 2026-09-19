import type { CSSProperties } from 'react';

/** Match width of the “Know more” pill so action buttons align visually. */
export const EVENT_PILL_MIN_WIDTH = '7.25rem';

export function eventPillStyle(compact?: boolean, variant: 'dark' | 'outline' = 'dark'): CSSProperties {
  const base: CSSProperties = {
    fontWeight: 600,
    padding: '0.4rem 1.1rem',
    fontSize: compact ? '0.8rem' : '0.875rem',
    borderRadius: 999,
    minWidth: EVENT_PILL_MIN_WIDTH,
    maxWidth: EVENT_PILL_MIN_WIDTH,
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    textAlign: 'center',
    lineHeight: 1.25,
    whiteSpace: 'normal',
  };
  if (variant === 'outline') {
    return {
      ...base,
      border: '1px solid #1a1f2e',
      color: '#1a1f2e',
      backgroundColor: '#fff',
    };
  }
  return {
    ...base,
    border: '1px solid #1a1f2e',
    color: '#fff',
    backgroundColor: '#1a1f2e',
  };
}

/** Admin action buttons — badge look, slightly wider than Know more. */
export const EVENT_ACTION_BADGE_MIN_WIDTH = '9.5rem';

export function eventActionBadgeStyle(compact?: boolean): CSSProperties {
  return {
    fontWeight: 600,
    padding: compact ? '0.45rem 0.85rem' : '0.5rem 1rem',
    fontSize: compact ? '0.78rem' : '0.8125rem',
    borderRadius: 8,
    minWidth: EVENT_ACTION_BADGE_MIN_WIDTH,
    maxWidth: '11.5rem',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    textAlign: 'center',
    lineHeight: 1.3,
    whiteSpace: 'normal',
    border: '1px solid #ced4da',
    color: '#1a1f2e',
    backgroundColor: '#f1f3f5',
  };
}
