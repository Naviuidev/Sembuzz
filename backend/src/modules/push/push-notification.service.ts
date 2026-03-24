import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';

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

  /** Notify users who opted into this subcategory and registered a device token. */
  async notifyUsersForApprovedEvent(event: {
    id: string;
    schoolId: string;
    subCategoryId: string;
    title: string;
  }): Promise<void> {
    if (!this.messaging) return;

    const users = await this.prisma.user.findMany({
      where: {
        schoolId: event.schoolId,
        status: 'active',
        notificationSubCategories: { some: { subCategoryId: event.subCategoryId } },
      },
      include: { pushDevices: true },
    });

    const tokens = [...new Set(users.flatMap((u) => u.pushDevices.map((d) => d.token)))];
    if (tokens.length === 0) return;

    const title = 'New post';
    const body =
      event.title.length > 120 ? `${event.title.slice(0, 117)}…` : event.title;
    const data = {
      eventId: event.id,
      type: 'news_approved',
    };

    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const batch = tokens.slice(i, i + chunkSize);
      try {
        const res = await this.messaging.sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
          android: { priority: 'high' },
          apns: { payload: { aps: { sound: 'default' } } },
        });
        if (res.failureCount > 0) {
          res.responses.forEach((r, idx) => {
            if (!r.success && r.error) {
              this.log.debug(`FCM fail token[${i + idx}]: ${r.error.message}`);
            }
          });
        }
      } catch (e) {
        this.log.error(`sendEachForMulticast: ${e instanceof Error ? e.message : e}`);
      }
    }
  }
}
