import { AppService } from './app.service';
import { PublishedBlogsService } from './published-blogs.service';
export declare class AppController {
    private readonly appService;
    private readonly publishedBlogs;
    constructor(appService: AppService, publishedBlogs: PublishedBlogsService);
    getHello(): string;
    /** Public blog list (also under /events/blogs). Registered here so GET always resolves even if /events/* routing differs on host. */
    listPublicBlogs(schoolId?: string, q?: string, fromStr?: string, toStr?: string, subCategoryIds?: string): Promise<{
        publishedAt: Date;
        school: {
            id: string;
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
        };
        content: string;
        title: string;
        id: string;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[] | {
        publishedAt: string;
        school: {
            id: string;
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
        };
        content: string;
        title: string;
        id: string;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getPublicBlogById(id: string): Promise<{
        school: {
            id: string;
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
}
