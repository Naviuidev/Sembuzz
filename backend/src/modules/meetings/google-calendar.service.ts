import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

export interface CreateGoogleMeetOptions {
  title: string;
  startISO: string;
  endISO: string;
  ianaTimeZone: string;
  attendeeEmails: string[];
}

const TOKEN_FILE = path.join(process.cwd(), '.google-refresh-token');

@Injectable()
export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null = null;
  private calendarId: string | null = null;

  constructor(private config: ConfigService) {
    const clientId = this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI');
    const refreshTokenFromEnv = this.config.get<string>('GOOGLE_REFRESH_TOKEN');
    let refreshToken = refreshTokenFromEnv;
    if (!refreshToken && fs.existsSync(TOKEN_FILE)) {
      try {
        refreshToken = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
      } catch {
        refreshToken = undefined;
      }
    }
    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      this.calendarId = this.config.get<string>('GOOGLE_CALENDAR_ID') || 'primary';
      this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      return;
    }
    const credentialsPath = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    const credentialsJson = this.config.get<string>('GOOGLE_SERVICE_ACCOUNT_JSON');
    this.calendarId = this.config.get<string>('GOOGLE_CALENDAR_ID') ?? null;
    if (!this.calendarId) return;
    let credentials: object | undefined;
    if (credentialsJson) {
      try {
        credentials = JSON.parse(credentialsJson) as object;
      } catch {
        credentials = undefined;
      }
    }
    if (!credentials && credentialsPath) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        credentials = require(credentialsPath) as object;
      } catch {
        credentials = undefined;
      }
    }
    if (!credentials) return;
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  isConfigured(): boolean {
    return this.calendar !== null && this.calendarId !== null;
  }

  async createMeetEvent(options: CreateGoogleMeetOptions): Promise<{ link: string } | { error: string }> {
    if (!this.calendar || !this.calendarId) {
      return {
        error:
          'Google Calendar is not configured. Either: (1) Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI and visit GET /google/auth to authorize, or (2) Set GOOGLE_CALENDAR_ID and GOOGLE_SERVICE_ACCOUNT_JSON.',
      };
    }

    try {
      const requestId = `sembuzz-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const event: calendar_v3.Schema$Event = {
        summary: options.title,
        start: {
          dateTime: options.startISO,
          timeZone: options.ianaTimeZone,
        },
        end: {
          dateTime: options.endISO,
          timeZone: options.ianaTimeZone,
        },
        attendees: options.attendeeEmails.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId,
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 5 },
            { method: 'popup', minutes: 5 },
          ],
        },
      };

      const res = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });

      const link =
        res.data.hangoutLink ||
        res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
        '';
      if (!link) return { error: 'Google Meet link was not returned.' };
      return { link };
    } catch (err: any) {
      const message = err?.message || String(err);
      return { error: `Google Calendar error: ${message}` };
    }
  }
}
