import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { google, calendar_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
const TOKEN_FILE = path.join(process.cwd(), '.google-refresh-token');

function getCalendarAddRedirectUri(mainRedirectUri: string): string {
  try {
    const u = new URL(mainRedirectUri);
    u.pathname = '/google/calendar/add-callback';
    return u.toString();
  } catch {
    return mainRedirectUri.replace(/\/[^/]*$/, '/google/calendar/add-callback');
  }
}

function getRedirectUriFromRequest(req: Request): string {
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || (req as Request & { protocol?: string }).protocol || 'http';
  if (!host) return '';
  return `${protocol}://${host}/google/calendar/add-callback`;
}

interface CalendarAddState {
  returnUrl: string;
  title: string;
  description?: string;
  start: string;
  end: string;
}

function encodeState(state: CalendarAddState): string {
  return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}

function decodeState(stateStr: string): CalendarAddState | null {
  try {
    const json = Buffer.from(stateStr, 'base64url').toString('utf8');
    return JSON.parse(json) as CalendarAddState;
  } catch {
    return null;
  }
}

@Controller('google')
export class GoogleAuthController {
  constructor(private readonly config: ConfigService) {}

  @Get('auth')
  auth(@Res() res: Response) {
    const clientId = this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const redirectUri = this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI');
    if (!clientId || !redirectUri) {
      return res.status(500).send(
        '<html><body><p>Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URI in .env</p></body></html>',
      );
    }
    const oauth2Client = new google.auth.OAuth2(clientId, undefined, redirectUri);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
    return res.redirect(url);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error) {
      return res.status(400).send(
        `<html><body><p>Authorization failed: ${error}</p><p><a href="/google/auth">Try again</a></p></body></html>`,
      );
    }
    const clientId = this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI');
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).send(
        '<html><body><p>Google OAuth is not fully configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI in .env</p></body></html>',
      );
    }
    if (!code) {
      return res.status(400).send(
        '<html><body><p>No authorization code received.</p><p><a href="/google/auth">Authorize again</a></p></body></html>',
      );
    }
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    try {
      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;
      if (refreshToken) {
        fs.writeFileSync(TOKEN_FILE, refreshToken, 'utf8');
      }
      return res.send(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google Calendar connected</title></head><body style="font-family:sans-serif;padding:2rem;max-width:500px;margin:0 auto;"><h1>Google Calendar connected</h1><p>Meeting scheduling (Google Meet) will use this account. You can close this page.</p>${refreshToken ? '<p>Refresh token saved.</p>' : '<p>No new refresh token (already authorized).</p>'}</body></html>`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).send(
        `<html><body><p>Failed to exchange code: ${message}</p><p><a href="/google/auth">Try again</a></p></body></html>`,
      );
    }
  }

  /**
   * User "Add to Google Calendar" flow: redirect to Google sign-in so the event is added to the account they choose.
   * Query: returnUrl, title, description (optional), start (ISO), end (ISO).
   */
  @Get('calendar/add-auth')
  calendarAddAuth(
    @Query('returnUrl') returnUrl: string,
    @Query('title') title: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('description') description: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const host = req?.get('host') ?? '';
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const clientId =
      isLocalhost && this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID_LOCAL')
        ? this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID_LOCAL')
        : this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const mainRedirect = this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI');
    let redirectUri =
      isLocalhost && req
        ? getRedirectUriFromRequest(req)
        : this.config.get<string>('GOOGLE_CALENDAR_ADD_REDIRECT_URI') ||
          (mainRedirect ? getCalendarAddRedirectUri(mainRedirect) : undefined);
    if (!redirectUri && req) redirectUri = getRedirectUriFromRequest(req);
    if (!clientId || !redirectUri) {
      return res.status(500).send(
        '<html><body><p>Google Calendar add is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URI (or GOOGLE_CALENDAR_ADD_REDIRECT_URI) in .env. For local dev, set GOOGLE_OAUTH_CLIENT_ID_LOCAL and GOOGLE_OAUTH_CLIENT_SECRET_LOCAL and add http://localhost:3000/google/calendar/add-callback to Google Cloud Console.</p></body></html>',
      );
    }
    if (!returnUrl?.trim() || !title?.trim() || !start?.trim() || !end?.trim()) {
      return res.status(400).send(
        '<html><body><p>Missing required parameters: returnUrl, title, start, end.</p></body></html>',
      );
    }
    const state = encodeState({
      returnUrl: returnUrl.trim(),
      title: title.trim(),
      description: description?.trim() || undefined,
      start: start.trim(),
      end: end.trim(),
    });
    const oauth2Client = new google.auth.OAuth2(clientId, undefined, redirectUri);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state,
    });
    return res.redirect(url);
  }

  /**
   * OAuth callback for "Add to Google Calendar": exchange code, insert event into user's calendar, redirect back to app.
   */
  @Get('calendar/add-callback')
  async calendarAddCallback(
    @Query('code') code: string,
    @Query('state') stateStr: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (error) {
      const returnUrl = stateStr ? (decodeState(stateStr)?.returnUrl || '/events') : '/events';
      return res.redirect(`${returnUrl}?googleCalError=${encodeURIComponent(error)}`);
    }
    const host = req?.get('host') ?? '';
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const clientId =
      isLocalhost && this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID_LOCAL')
        ? this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID_LOCAL')
        : this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret =
      isLocalhost && this.config.get<string>('GOOGLE_OAUTH_CLIENT_SECRET_LOCAL')
        ? this.config.get<string>('GOOGLE_OAUTH_CLIENT_SECRET_LOCAL')
        : this.config.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
    const mainRedirect = this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI');
    let redirectUri =
      isLocalhost && req
        ? getRedirectUriFromRequest(req)
        : this.config.get<string>('GOOGLE_CALENDAR_ADD_REDIRECT_URI') ||
          (mainRedirect ? getCalendarAddRedirectUri(mainRedirect) : undefined);
    if (!redirectUri && req) redirectUri = getRedirectUriFromRequest(req);
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).send(
        '<html><body><p>Google Calendar add is not fully configured.</p></body></html>',
      );
    }
    if (!code?.trim() || !stateStr?.trim()) {
      return res.status(400).send(
        '<html><body><p>Missing code or state.</p></body></html>',
      );
    }
    const state = decodeState(stateStr);
    const returnUrl = state?.returnUrl || '/events';
    const appendParams = (url: string, params: Record<string, string>) => {
      const sep = url.includes('?') ? '&' : '?';
      const q = new URLSearchParams(params).toString();
      return `${url}${sep}${q}`;
    };
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    try {
      const { tokens } = await oauth2Client.getToken(code);
      if (!tokens.access_token) {
        return res.redirect(appendParams(returnUrl, { googleCalError: 'No access token' }));
      }
      oauth2Client.setCredentials({ access_token: tokens.access_token });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const event: calendar_v3.Schema$Event = {
        summary: state?.title || 'Event',
        description: state?.description || undefined,
        start: { dateTime: state?.start || '', timeZone: 'UTC' },
        end: { dateTime: state?.end || '', timeZone: 'UTC' },
        reminders: { useDefault: true },
      };
      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      return res.redirect(appendParams(returnUrl, { googleCalSuccess: '1' }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.redirect(appendParams(returnUrl, { googleCalError: message }));
    }
  }
}
