import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';

/**
 * Sends FCM notifications when Firebase Admin is configured via **backend `.env`**
 * (`FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`).
 */
@Injectable()
export class PushNotificationService {
  private readonly log = new Logger(PushNotificationService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(private readonly prisma: PrismaService) {
    try {
      const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (json?.trim()) {
        const cred = JSON.parse(json) as admin.ServiceAccount;
        if (!admin.apps.length) {
          admin.initializeApp({ credential: admin.credential.cert(cred) });
        }
        this.messaging = admin.messaging();
        this.log.log('Firebase Admin initialized (FIREBASE_SERVICE_ACCOUNT_JSON)');
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        if (!admin.apps.length) {
          admin.initializeApp();
        }
        this.messaging = admin.messaging();
        this.log.log('Firebase Admin initialized (GOOGLE_APPLICATION_CREDENTIALS)');
      } else {
        this.log.warn('Push disabled: set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS');
      }
    } catch (e) {
      this.log.warn(`Firebase Admin init failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  isEnabled(): boolean {
    return this.messaging != null;
  }

  private toValidPublicImageUrl(raw?: string | null): string | undefined {
    const value = raw?.trim();
    if (!value) return undefined;
    try {
      const parsed = new URL(value);
      const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      const host = parsed.hostname.toLowerCase();
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      return isHttp && !isLocal ? parsed.toString() : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * FCM payloads need a public HTTPS URL; the in-app inbox can store a path clients resolve with their API base (e.g. /uploads/... for localhost).
   */
  private inboxLogoForStorage(
    logoRaw: string,
    candidateAbsoluteUrl: string | undefined,
  ): string | null {
    const publicUrl = this.toValidPublicImageUrl(candidateAbsoluteUrl);
    if (publicUrl) return publicUrl;
    const v = logoRaw.trim();
    if (!v) return null;
    if (v.startsWith('http://') || v.startsWith('https://')) {
      try {
        const p = new URL(v);
        const path = p.pathname + (p.search || '');
        return path.startsWith('/uploads') ? path : null;
      } catch {
        return null;
      }
    }
    let path = v.startsWith('/') ? v : `/${v}`;
    if (!path.startsWith('/uploads')) {
      path = `/uploads/${path.replace(/^\/+/, '')}`;
    }
    return path;
  }

  /** Notify users who opted into this subcategory; persist inbox for all matches, then send FCM if configured. */
  async notifyUsersForApprovedEvent(event: {
    id: string;
    schoolId: string;
    subCategoryId: string;
    title: string;
    schoolName?: string;
    schoolLogoUrl?: string | null;
  }): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        schoolId: event.schoolId,
        status: 'active',
        notificationSubCategories: { some: { subCategoryId: event.subCategoryId } },
      },
      include: { pushDevices: true },
    });

    const matchedUserIds = [...new Set(users.map((u) => u.id))];
    const tokens = [...new Set(users.flatMap((u) => u.pushDevices.map((d) => d.token)))];
    this.log.log(
      `[Push] event=${event.id} school=${event.schoolId} subCategory=${event.subCategoryId} matchedUsers=${users.length} tokens=${tokens.length} fcm=${this.messaging ? 'on' : 'off'}`,
    );
    const schoolName = event.schoolName?.trim() || 'School';
    const apiBase = (process.env.API_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const logoRaw = event.schoolLogoUrl?.trim() || '';
    const candidateSchoolLogoUrl = logoRaw
      ? logoRaw.startsWith('http')
        ? logoRaw
        : `${apiBase}${logoRaw.startsWith('/') ? '' : '/'}${logoRaw}`
      : undefined;
    const schoolLogoUrl = this.toValidPublicImageUrl(candidateSchoolLogoUrl);
    const inboxLogoUrl = logoRaw
      ? this.inboxLogoForStorage(logoRaw, candidateSchoolLogoUrl)
      : null;

    const title = `From ${schoolName}`;
    const body = event.title.length > 140 ? `${event.title.slice(0, 137)}…` : event.title;
    const data = {
      eventId: event.id,
      type: 'news_approved',
      schoolName,
    };

    // In-app inbox: always record for matched users at trigger time (independent of FCM).
    if (matchedUserIds.length > 0) {
      try {
        const inbox = (this.prisma as PrismaService & { userNotificationInbox: any }).userNotificationInbox;
        await inbox.createMany({
          data: matchedUserIds.map((userId) => ({
            id: randomUUID(),
            userId,
            eventId: event.id,
            schoolId: event.schoolId,
            schoolName,
            schoolLogoUrl: inboxLogoUrl,
            title,
            body,
          })),
        });
      } catch (e) {
        this.log.warn(
          `[Push] inbox save skipped: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    if (!this.messaging) {
      this.log.warn(`[Push] FCM skipped event=${event.id} — Firebase messaging not initialized`);
      return;
    }

    const chunkSize = 500;
    if (tokens.length > 0) {
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const batch = tokens.slice(i, i + chunkSize);
        try {
          const res = await this.messaging.sendEachForMulticast({
            tokens: batch,
            notification: { title, body },
            data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
            android: {
              priority: 'high',
              notification: {
                color: '#FFFFFF',
              },
            },
            apns: {
              payload: { aps: { sound: 'default' } },
            },
          });
          this.log.log(
            `[Push] batch ${i / chunkSize + 1}: success=${res.successCount} failure=${res.failureCount}`,
          );
          const invalidTokens: string[] = [];
          if (res.failureCount > 0) {
            res.responses.forEach((r, idx) => {
              if (!r.success && r.error) {
                this.log.debug(`FCM fail token[${i + idx}]: ${r.error.message}`);
                const code = r.error.code ?? '';
                const msg = (r.error.message ?? '').toLowerCase();
                const isInvalidToken =
                  code === 'messaging/registration-token-not-registered' ||
                  code === 'messaging/invalid-registration-token' ||
                  code === 'messaging/invalid-argument' ||
                  msg.includes('requested entity was not found') ||
                  msg.includes('not a valid fcm registration token');
                if (isInvalidToken) {
                  invalidTokens.push(batch[idx]);
                }
              }
            });
          }
          if (invalidTokens.length > 0) {
            const uniqueInvalid = [...new Set(invalidTokens)];
            await this.prisma.userPushDevice.deleteMany({
              where: { token: { in: uniqueInvalid } },
            });
            this.log.warn(`[Push] removed ${uniqueInvalid.length} invalid token(s) from database`);
          }
        } catch (e) {
          this.log.error(`sendEachForMulticast: ${e instanceof Error ? e.message : e}`);
        }
      }
    }
  }
}
