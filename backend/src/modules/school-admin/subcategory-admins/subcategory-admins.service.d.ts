import { PrismaService } from '../../../prisma/prisma.service';
export declare class SchoolAdminSubcategoryAdminsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(schoolId: string): Promise<({
        school: {
            id: string;
            name: string;
            domain: string | null;
        };
        category: {
            id: string;
            name: string;
        };
        subCategory: {
            category: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
        };
        subCategories: ({
            subCategory: {
                id: string;
                name: string;
            };
        } & {
            subCategoryId: string;
            id: string;
            subCategoryAdminId: string;
            createdAt: Date;
        })[];
    } & {
        schoolId: string;
        subCategoryId: string;
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        email: string;
        password: string;
        isFirstLogin: boolean;
    })[]>;
    ban(id: string, schoolId: string): Promise<{
        schoolId: string;
        subCategoryId: string;
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        email: string;
        password: string;
        isFirstLogin: boolean;
    }>;
    unban(id: string, schoolId: string): Promise<{
        schoolId: string;
        subCategoryId: string;
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        email: string;
        password: string;
        isFirstLogin: boolean;
    }>;
}
