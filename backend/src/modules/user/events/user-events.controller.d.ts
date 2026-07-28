import { UserEventsService } from './user-events.service';
import { AddCommentDto } from './dto/add-comment.dto';
export declare class UserEventsController {
    private readonly userEventsService;
    constructor(userEventsService: UserEventsService);
    getEngagement(req: {
        user: {
            sub: string;
        };
    }, eventIdsStr?: string): Promise<{
        likes: Record<string, number>;
        commentCounts: Record<string, number>;
        likedByMe: string[];
        savedByMe: string[];
    }>;
    getSavedEvents(req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
    getLikedEvents(req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
    toggleLike(req: {
        user: {
            sub: string;
        };
    }, eventId: string): Promise<{
        liked: boolean;
        count: number;
    }>;
    getComments(req: {
        user: {
            sub: string;
        };
    }, eventId: string): Promise<({
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
    addComment(req: {
        user: {
            sub: string;
        };
    }, eventId: string, dto: AddCommentDto): Promise<{
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
    toggleSave(req: {
        user: {
            sub: string;
        };
    }, eventId: string): Promise<{
        saved: boolean;
    }>;
}
