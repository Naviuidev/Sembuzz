import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
export declare class SubCategoryAdminBlogsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private ensureSubCategoryForAdmin;
    create(subCategoryAdminId: string, dto: CreateBlogDto): Promise<{
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
        contentBlocks: Prisma.JsonValue | null;
        status: string;
        published: boolean;
        publishedAt: Date | null;
        revertNotes: string | null;
        rejectNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findPending(subCategoryAdminId: string): Promise<({
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
        contentBlocks: Prisma.JsonValue | null;
        status: string;
        published: boolean;
        publishedAt: Date | null;
        revertNotes: string | null;
        rejectNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findReverted(subCategoryAdminId: string): Promise<({
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
        contentBlocks: Prisma.JsonValue | null;
        status: string;
        published: boolean;
        publishedAt: Date | null;
        revertNotes: string | null;
        rejectNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findRejected(subCategoryAdminId: string): Promise<({
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
        contentBlocks: Prisma.JsonValue | null;
        status: string;
        published: boolean;
        publishedAt: Date | null;
        revertNotes: string | null;
        rejectNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findApproved(subCategoryAdminId: string): Promise<({
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
        contentBlocks: Prisma.JsonValue | null;
        status: string;
        published: boolean;
        publishedAt: Date | null;
        revertNotes: string | null;
        rejectNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
