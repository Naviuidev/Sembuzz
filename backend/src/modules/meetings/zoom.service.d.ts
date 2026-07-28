import { ConfigService } from '@nestjs/config';
export interface CreateZoomMeetingOptions {
    topic: string;
    startISO: string;
    durationMinutes: number;
    timeZone: string;
    attendeeEmails?: string[];
}
export declare class ZoomService {
    private config;
    private accountId;
    private clientId;
    private clientSecret;
    private cachedToken;
    constructor(config: ConfigService);
    isConfigured(): boolean;
    private getAccessToken;
    createMeeting(options: CreateZoomMeetingOptions): Promise<{
        link: string;
    } | {
        error: string;
    }>;
}
