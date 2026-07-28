import { CategoryAdminBlogsService } from './category-admin-blogs.service';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { RevertBlogDto } from './dto/revert-blog.dto';
import { RejectBlogDto } from './dto/reject-blog.dto';
export declare class CategoryAdminBlogsController {
    private readonly blogsService;
    constructor(blogsService: CategoryAdminBlogsService);
    pending(req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
    })[]>;
    approved(req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
    })[]>;
    update(id: string, req: {
        user: {
            sub: string;
        };
    }, dto: UpdateBlogDto): Promise<{
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
    revert(id: string, req: {
        user: {
            sub: string;
        };
    }, dto: RevertBlogDto): Promise<{
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
    reject(id: string, req: {
        user: {
            sub: string;
        };
    }, dto: RejectBlogDto): Promise<{
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
    approve(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
    }) | null>;
    publishDraft(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
    }) | null>;
    /** POST + {} body avoids empty-body JSON parse issues; works if DELETE is blocked (404). */
    removeViaPost(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        ok: boolean;
    }>;
    remove(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        ok: boolean;
    }>;
}
