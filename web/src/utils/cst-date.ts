/**
 * Central Time (America/Chicago) helpers for banner and sponsored ad start/end times.
 * All API values remain in UTC; these convert to/from CST for the UI.
 */

const CST_TZ = 'America/Chicago';

/** Format a UTC Date for display in CST (e.g. "Mar 2, 2026, 2:30 PM") */
export function formatInCST(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: CST_TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Convert a UTC Date to "yyyy-MM-ddTHH:mm" in CST for datetime-local input */
export function utcToCSTDatetimeLocalString(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const y = get('year');
  const m = get('month');
  const d = get('day');
  const h = get('hour');
  const min = get('minute');
  return `${y}-${m}-${d}T${h}:${min}`;
}

/** Parse "yyyy-MM-ddTHH:mm" as CST and return a Date in UTC */
export function cstDatetimeLocalStringToUTC(s: string): Date {
  const [datePart, timePart] = s.split('T');
  if (!datePart || !timePart) return new Date(NaN);
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.split(':').map(Number);
  if ([y, m, d, h, min].some(Number.isNaN)) return new Date(NaN);
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CST_TZ,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = formatter.formatToParts(utcNoon);
  const chicagoHour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '12', 10);
  const offsetHours = 12 - chicagoHour;
  return new Date(Date.UTC(y, m - 1, d, h + offsetHours, min));
}
