import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CreateZoomMeetingOptions {
  topic: string;
  startISO: string;
  durationMinutes: number;
  timeZone: string;
  attendeeEmails?: string[];
}

interface ZoomTokenResponse {
  access_token: string;
  expires_in: number;
}

interface ZoomCreateMeetingResponse {
  id: number;
  join_url: string;
  start_url?: string;
}

@Injectable()
export class ZoomService {
  private accountId: string | null = null;
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(private config: ConfigService) {
    this.accountId = this.config.get<string>('ZOOM_ACCOUNT_ID') ?? null;
    this.clientId = this.config.get<string>('ZOOM_CLIENT_ID') ?? null;
    this.clientSecret = this.config.get<string>('ZOOM_CLIENT_SECRET') ?? null;
  }

  isConfigured(): boolean {
    return !!(this.accountId && this.clientId && this.clientSecret);
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return this.cachedToken.token;
    }
    if (!this.accountId || !this.clientId || !this.clientSecret) return null;

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(this.accountId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ZoomTokenResponse;
    this.cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return this.cachedToken.token;
  }

  async createMeeting(options: CreateZoomMeetingOptions): Promise<{ link: string } | { error: string }> {
    if (!this.isConfigured()) {
      return { error: 'Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.' };
    }

    const token = await this.getAccessToken();
    if (!token) return { error: 'Failed to obtain Zoom access token.' };

    const startDate = new Date(options.startISO);
    const duration = Math.max(15, Math.min(480, options.durationMinutes || 60));

    const body = {
      topic: options.topic,
      type: 2,
      start_time: startDate.toISOString(),
      duration: duration,
      timezone: options.timeZone,
      settings: {
        join_before_host: true,
        waiting_room: false,
        approval_type: 2,
        reminder: true,
      },
    };

    try {
      const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { error: `Zoom API error: ${res.status} ${errText}` };
      }
      const data = (await res.json()) as ZoomCreateMeetingResponse;
      const link = data.join_url || '';
      if (!link) return { error: 'Zoom did not return a join URL.' };
      return { link };
    } catch (err: any) {
      return { error: `Zoom error: ${err?.message || String(err)}` };
    }
  }
}
