/**
 * Get start and end in UTC ISO, and IANA zone for Google Calendar.
 * timeSlot e.g. "9:00 AM - 10:00 AM", meetingDate "2025-02-01", timeZoneLabel "US" or "India"
 */
export declare function getMeetingStartEndISO(meetingDate: string, timeSlot: string, timeZoneLabel: string): {
    startISO: string;
    endISO: string;
    ianaZone: string;
} | null;
