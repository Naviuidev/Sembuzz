import { UserNotificationsService } from './user-notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UpdateNotificationSubcategoriesDto } from './dto/update-notification-subcategories.dto';
export declare class UserNotificationsController {
    private readonly notifications;
    constructor(notifications: UserNotificationsService);
    registerPushToken(req: {
        user: {
            sub: string;
        };
    }, dto: RegisterPushTokenDto): Promise<{
        ok: boolean;
    }>;
    removePushToken(req: {
        user: {
            sub: string;
        };
    }, token: string | undefined): Promise<{
        ok: boolean;
    }>;
    getSubcategories(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        subCategoryIds: string[];
    }>;
    setSubcategories(req: {
        user: {
            sub: string;
        };
    }, dto: UpdateNotificationSubcategoriesDto): Promise<{
        subCategoryIds: string[];
    }>;
    getInbox(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        [key: string]: unknown;
        id: string;
        schoolId: string | null;
        eventId: string | null;
        schoolLogoUrl: string | null;
    }[]>;
    getUnreadCount(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        unreadCount: number;
    }>;
    markAllRead(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        ok: boolean;
    }>;
    markRead(req: {
        user: {
            sub: string;
        };
    }, idFromParam: string | undefined): Promise<{
        ok: boolean;
    }>;
}
