import { PrismaService } from '../../../prisma/prisma.service';
export declare class SchoolAdminPostsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllForSchool(schoolId: string): Promise<({
        subCategory: {
            category: {
                id: string;
                name: string;
            };
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
    findOne(id: string, schoolId: string): Promise<{
        subCategory: {
            category: {
                id: string;
                name: string;
            };
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
    delete(id: string, schoolId: string): Promise<{
        deleted: boolean;
    }>;
    update(id: string, schoolId: string, data: {
        title?: string;
        description?: string;
        externalLink?: string;
        commentsEnabled?: boolean;
        imageUrls?: string[];
    }): Promise<{
        subCategory: {
            category: {
                id: string;
                name: string;
            };
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
