import { PrismaService } from '../../../prisma/prisma.service';
export declare class UserEventsService {
    private prisma;
    constructor(prisma: PrismaService);
    private ensureUserInSchool;
    private getEventSchoolId;
    getEngagement(eventIds: string[], userId: string): Promise<{
        likes: Record<string, number>;
        commentCounts: Record<string, number>;
        likedByMe: string[];
        savedByMe: string[];
    }>;
    toggleLike(eventId: string, userId: string): Promise<{
        liked: boolean;
        count: number;
    }>;
    getComments(eventId: string, userId: string): Promise<({
        user: {
            id: string;
            name: string;
            profilePicUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        eventId: string;
        userId: string;
        text: string;
    })[]>;
    addComment(eventId: string, userId: string, text: string): Promise<{
        comment: {
            user: {
                id: string;
                name: string;
                profilePicUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            eventId: string;
            userId: string;
            text: string;
        };
        commentCount: number;
    }>;
    deleteComment(commentId: string, userId: string): Promise<{
        commentCount: number;
    }>;
    toggleSave(eventId: string, userId: string): Promise<{
        saved: boolean;
    }>;
    getSavedEvents(userId: string): Promise<{
        savedAt: Date;
        school: {
            name: string;
            city: string;
            image: string | null;
        };
        subCategory: {
            id: string;
            name: string;
        };
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
    }[]>;
    getLikedEvents(userId: string): Promise<{
        id: string;
        title: string;
        description: string | null;
        externalLink: string | null;
        imageUrls: string | null;
        school: {
            name: string;
            city: string;
            image: string | null;
        };
        subCategory: {
            id: string;
            name: string;
        };
        likedAt: string;
    }[]>;
}
