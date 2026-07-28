import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateEventDto } from './dto/update-event.dto';
import { PushNotificationService } from '../../push/push-notification.service';
export declare class CategoryAdminEventsService {
    private prisma;
    private pushNotifications;
    constructor(prisma: PrismaService, pushNotifications: PushNotificationService);
    private getCategoryAdminCategoryIds;
    private ensureEventAccess;
    findPendingForCategoryAdmin(categoryAdminId: string): Promise<({
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    })[]>;
    findApprovedForCategoryAdmin(categoryAdminId: string): Promise<({
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    })[]>;
    delete(eventId: string, categoryAdminId: string): Promise<{
        deleted: boolean;
    }>;
    update(eventId: string, categoryAdminId: string, dto: UpdateEventDto): Promise<{
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    }>;
    revert(eventId: string, categoryAdminId: string, revertNotes: string): Promise<{
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    }>;
    approve(eventId: string, categoryAdminId: string): Promise<{
        school: {
            name: string;
            image: string | null;
        };
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    }>;
}
