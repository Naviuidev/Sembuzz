/**
 * Parse time slot string (e.g. "9:00 AM - 10:00 AM") and meeting date (YYYY-MM-DD)
 * with timezone label (US, India) into start/end ISO (UTC) and IANA zone for Calendar.
 */
const TIMEZONE_MAP: Record<string, string> = {
  US: 'America/New_York',
  India: 'Asia/Kolkata',
};

/** Offset for building ISO with offset (no DST). India +05:30, US -05:00 (EST). */
const OFFSET_MAP: Record<string, string> = {
  US: '-05:00',
  India: '+05:30',
};

function parseTimeToMinutes(s: string): number | null {
  const match = s.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (match[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Get start and end in UTC ISO, and IANA zone for Google Calendar.
 * timeSlot e.g. "9:00 AM - 10:00 AM", meetingDate "2025-02-01", timeZoneLabel "US" or "India"
 */
export function getMeetingStartEndISO(
  meetingDate: string,
  timeSlot: string,
  timeZoneLabel: string,
): { startISO: string; endISO: string; ianaZone: string } | null {
  const ianaZone = TIMEZONE_MAP[timeZoneLabel] || 'UTC';
  const offset = OFFSET_MAP[timeZoneLabel] || '+00:00';
  const parts = timeSlot.split('-').map((p) => p.trim());
  if (parts.length < 2) return null;
  const startMinutes = parseTimeToMinutes(parts[0]);
  const endMinutes = parseTimeToMinutes(parts[1]);
  if (startMinutes == null || endMinutes == null) return null;
  const dateOnly = meetingDate.split('T')[0];
  if (!dateOnly || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;

  const startH = Math.floor(startMinutes / 60);
  const startM = startMinutes % 60;
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const startLocalStr = `${dateOnly}T${pad(startH)}:${pad(startM)}:00${offset}`;
  const endLocalStr = `${dateOnly}T${pad(endH)}:${pad(endM)}:00${offset}`;

  try {
    const startDate = new Date(startLocalStr);
    const endDate = new Date(endLocalStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
    return {
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
      ianaZone,
    };
  } catch {
    return null;
  }
}
