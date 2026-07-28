import { CategoryAdminCategoriesService } from './categories.service';
export declare class CategoryAdminCategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoryAdminCategoriesService);
    getMyCategories(req: any): Promise<({
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
    getMyCategory(req: any): Promise<{
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
}
