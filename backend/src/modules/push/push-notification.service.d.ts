import { PrismaService } from '../../prisma/prisma.service';
/**
 * Sends push when:
 * - **Expo** (`ExponentPushToken[...]`) — Expo Push API (iOS TestFlight + Android from EAS builds).
 * - **FCM** — Firebase Admin (`FIREBASE_SERVICE_ACCOUNT_JSON` / `GOOGLE_APPLICATION_CREDENTIALS`), Android native tokens.
 */
export declare class PushNotificationService {
    private readonly prisma;
    private readonly log;
    private messaging;
    /** Expo Push; optional `EXPO_ACCESS_TOKEN` for higher rate limits / CI. */
    private readonly expoSdk;
    constructor(prisma: PrismaService);
    isEnabled(): boolean;
    private toValidPublicImageUrl;
    /**
     * FCM payloads need a public HTTPS URL; the in-app inbox can store a path clients resolve with their API base (e.g. /uploads/... for localhost).
     */
    private inboxLogoForStorage;
    /** Notify users who opted into this subcategory; persist inbox for all matches, then send FCM if configured. */
    notifyUsersForApprovedEvent(event: {
        id: string;
        schoolId: string;
        subCategoryId: string;
        title: string;
        schoolName?: string;
        schoolLogoUrl?: string | null;
    }): Promise<void>;
}
