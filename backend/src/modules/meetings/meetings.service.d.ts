import { GoogleCalendarService } from './google-calendar.service';
import { ZoomService } from './zoom.service';
export interface ScheduleMeetingInput {
    meetingType: 'google_meet' | 'zoom';
    meetingDate: string;
    timeSlot: string;
    timeZone: string;
    title: string;
    attendeeEmails: string[];
}
export declare class MeetingsService {
    private googleCalendar;
    private zoom;
    constructor(googleCalendar: GoogleCalendarService, zoom: ZoomService);
    /**
     * Schedule a meeting (Google Meet or Zoom) and return the join link.
     * For Meet: creates a calendar event with 5-min reminder and adds attendees (they get invite + reminder).
     * For Zoom: creates a meeting with reminder enabled; Zoom sends reminder emails to participants.
     */
    scheduleMeeting(input: ScheduleMeetingInput): Promise<{
        meetingLink: string;
    } | {
        error: string;
    }>;
}
