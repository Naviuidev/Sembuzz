import { Injectable } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { ZoomService } from './zoom.service';
import { getMeetingStartEndISO } from './meetings.util';

export interface ScheduleMeetingInput {
  meetingType: 'google_meet' | 'zoom';
  meetingDate: string;
  timeSlot: string;
  timeZone: string;
  title: string;
  attendeeEmails: string[];
}

@Injectable()
export class MeetingsService {
  constructor(
    private googleCalendar: GoogleCalendarService,
    private zoom: ZoomService,
  ) {}

  /**
   * Schedule a meeting (Google Meet or Zoom) and return the join link.
   * For Meet: creates a calendar event with 5-min reminder and adds attendees (they get invite + reminder).
   * For Zoom: creates a meeting with reminder enabled; Zoom sends reminder emails to participants.
   */
  async scheduleMeeting(input: ScheduleMeetingInput): Promise<{ meetingLink: string } | { error: string }> {
    const parsed = getMeetingStartEndISO(input.meetingDate, input.timeSlot, input.timeZone);
    if (!parsed) {
      return { error: 'Invalid meeting date, time slot, or time zone.' };
    }

    const startDate = new Date(parsed.startISO);
    const endDate = new Date(parsed.endISO);
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60_000) || 60;

    if (input.meetingType === 'google_meet') {
      if (!this.googleCalendar.isConfigured()) {
        return { error: 'Google Meet is not configured. Contact support.' };
      }
      const result = await this.googleCalendar.createMeetEvent({
        title: input.title,
        startISO: parsed.startISO,
        endISO: parsed.endISO,
        ianaTimeZone: parsed.ianaZone,
        attendeeEmails: input.attendeeEmails,
      });
      if ('error' in result) return result;
      return { meetingLink: result.link };
    }

    if (input.meetingType === 'zoom') {
      if (!this.zoom.isConfigured()) {
        return { error: 'Zoom is not configured. Contact support.' };
      }
      const result = await this.zoom.createMeeting({
        topic: input.title,
        startISO: parsed.startISO,
        durationMinutes,
        timeZone: parsed.ianaZone,
        attendeeEmails: input.attendeeEmails,
      });
      if ('error' in result) return result;
      return { meetingLink: result.link };
    }

    return { error: 'Unsupported meeting type.' };
  }
}
