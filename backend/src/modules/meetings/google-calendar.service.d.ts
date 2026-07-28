import { ConfigService } from '@nestjs/config';
export interface CreateGoogleMeetOptions {
    title: string;
    startISO: string;
    endISO: string;
    ianaTimeZone: string;
    attendeeEmails: string[];
}
export declare class GoogleCalendarService {
    private config;
    private calendar;
    private calendarId;
    constructor(config: ConfigService);
    isConfigured(): boolean;
    createMeetEvent(options: CreateGoogleMeetOptions): Promise<{
        link: string;
    } | {
        error: string;
    }>;
}
