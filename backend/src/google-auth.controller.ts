import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
const TOKEN_FILE = path.join(process.cwd(), '.google-refresh-token');

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
}
