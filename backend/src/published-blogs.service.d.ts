import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
export declare class PublishedBlogsService {
    private prisma;
    constructor(prisma: PrismaService);
    listPublishedBlogs(schoolId?: string, q?: string, fromStr?: string, toStr?: string, subCategoryIdsCsv?: string): Promise<{
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
    getPublishedBlogById(id: string): Promise<{
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
        contentBlocks: Prisma.JsonValue | null;
        status: string;
        published: boolean;
        publishedAt: Date | null;
        revertNotes: string | null;
        rejectNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
