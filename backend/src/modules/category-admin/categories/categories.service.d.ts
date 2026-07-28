import { PrismaService } from '../../../prisma/prisma.service';
export declare class CategoryAdminCategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    getMyCategory(categoryId: string, categoryAdminId: string): Promise<{
        school: {
            id: string;
            name: string;
            domain: string | null;
        };
        subcategories: {
            id: string;
            categoryId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
        }[];
    } & {
        schoolId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    /** All categories this category admin has access to (primary + many-to-many). */
    getMyCategories(categoryAdminId: string): Promise<({
        school: {
            id: string;
            name: string;
            domain: string | null;
        };
        subcategories: {
            id: string;
            categoryId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
        }[];
    } & {
        schoolId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    })[]>;
}
