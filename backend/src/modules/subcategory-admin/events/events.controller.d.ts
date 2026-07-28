import type { Request as ExpressRequest } from 'express';
import { EventsService, AnalyzeBannerResult } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { SubCategoryAdminBlogsService } from '../blogs/blogs.service';
export declare class EventsController {
    private readonly eventsService;
    private readonly blogsService;
    constructor(eventsService: EventsService, blogsService: SubCategoryAdminBlogsService);
    analyzeBanner(file: Express.Multer.File): Promise<AnalyzeBannerResult>;
    /** Event images, or blog images when query ?for=blog (same URL so one proxy / one route always works) */
    uploadEventImage(req: ExpressRequest, file: Express.Multer.File): Promise<{
        url: string;
    }>;
    /** Create blog (raw body — avoids ValidationPipe rejecting hero/contentBlocks). */
    createBlog(req: ExpressRequest & {
        user: {
            sub: string;
        };
    }): Promise<{
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        content: string;
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        coverImageUrl: string | null;
        imageUrls: string | null;
        heroTitle: string | null;
        heroParagraph: string | null;
        heroButtonText: string | null;
        heroButtonLink: string | null;
        contentBlocks: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        published: boolean;
        publishedAt: Date | null;
        revertNotes: string | null;
        rejectNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateEventDto): Promise<{
        subCategory: {
            id: string;
            name: string;
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
    findPending(req: {
        user: {
            sub: string;
        };
    }): Promise<({
        subCategory: {
            id: string;
            name: string;
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
    findReverted(req: {
        user: {
            sub: string;
        };
    }): Promise<({
        subCategory: {
            id: string;
            name: string;
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
    findApproved(req: {
        user: {
            sub: string;
        };
    }): Promise<({
        subCategory: {
            id: string;
            name: string;
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
}
