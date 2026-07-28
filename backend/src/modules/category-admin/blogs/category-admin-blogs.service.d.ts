import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateBlogDto } from './dto/update-blog.dto';
export declare class CategoryAdminBlogsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getCategoryAdminCategoryIds;
    private ensureBlogAccess;
    /** DB column may exist before Prisma client types include `publishedAt` */
    private setBlogPublishedAt;
    findPending(categoryAdminId: string): Promise<({
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
    /** Approved blogs (drafts + published) for View blogs */
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
    update(blogId: string, categoryAdminId: string, dto: UpdateBlogDto): Promise<{
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
    revert(blogId: string, categoryAdminId: string, revertNotes: string): Promise<{
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
    reject(blogId: string, categoryAdminId: string, rejectNotes: string): Promise<{
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
    /** Approve = live on public feed (same as news). No separate publish step. */
    approve(blogId: string, categoryAdminId: string): Promise<({
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
    /** Publish a previously saved draft */
    publishDraft(blogId: string, categoryAdminId: string): Promise<({
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
    /** Remove an approved blog from the public site (category admin only). */
    removeApproved(blogId: string, categoryAdminId: string): Promise<{
        ok: boolean;
    }>;
}
