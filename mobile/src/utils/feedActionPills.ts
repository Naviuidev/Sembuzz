import { isEventPrimaryActionLabel } from './eventPostPublic';

const FEED_ACTION_PALETTE = {
  success: { bg: '#d1e7dd', text: '#0f5132' },
  warning: { bg: '#fff3cd', text: '#664d03' },
  info: { bg: '#cff4fc', text: '#055160' },
  danger: { bg: '#f8d7da', text: '#842029' },
} as const;

export function feedActionPillColors(label: string, index: number): { bg: string; text: string } {
  const l = label.toLowerCase();
  if (l.includes('google') && l.includes('calendar')) {
    return FEED_ACTION_PALETTE.warning;
  }
  if (l.includes('apple') && l.includes('calendar')) {
    return FEED_ACTION_PALETTE.info;
  }
  if (isEventPrimaryActionLabel(label)) {
    return FEED_ACTION_PALETTE.success;
  }
  const fallbacks = [
    FEED_ACTION_PALETTE.danger,
    FEED_ACTION_PALETTE.warning,
    FEED_ACTION_PALETTE.info,
    FEED_ACTION_PALETTE.success,
  ];
  return fallbacks[index % fallbacks.length];
}
