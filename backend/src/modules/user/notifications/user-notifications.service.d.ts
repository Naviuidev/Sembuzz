import { PrismaService } from '../../../prisma/prisma.service';
export declare class UserNotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getInbox(userId: string): Promise<{
        [key: string]: unknown;
        id: string;
        schoolId: string | null;
        eventId: string | null;
        schoolLogoUrl: string | null;
    }[]>;
    private hasUsableLogo;
    private firstEventImageUrl;
    /**
     * Prefer current `School.image` for every row with `schoolId`, then fall back to the related
     * `Event` (school image or first image in `imageUrls`) so the list always shows a real asset
     * when one exists in the DB — not only when push persisted `schoolLogoUrl`.
     */
    private enrichInboxRowsWithSchoolLogos;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    markAllRead(userId: string): Promise<{
        ok: boolean;
    }>;
    markRead(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
    registerPushToken(userId: string, token: string, platform: string): Promise<{
        ok: boolean;
    }>;
    removePushToken(userId: string, token: string): Promise<{
        ok: boolean;
    }>;
    getNotificationSubcategories(userId: string): Promise<{
        subCategoryIds: string[];
    }>;
    /**
     * Replaces prefs. Only subcategories whose parent category belongs to the user's school are kept.
     */
    setNotificationSubcategories(userId: string, subCategoryIds: string[]): Promise<{
        subCategoryIds: string[];
    }>;
}
