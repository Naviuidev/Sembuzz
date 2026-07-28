import { CategoryAdminsService } from './category-admins.service';
import { CreateCategoryAdminDto } from '../dto/create-category-admin.dto';
import { UpdateCategoryAdminCategoriesDto } from '../dto/update-category-admin-categories.dto';
export declare class CategoryAdminsController {
    private readonly categoryAdminsService;
    constructor(categoryAdminsService: CategoryAdminsService);
    findAll(req: any): Promise<({
        school: {
            id: string;
            name: string;
            domain: string | null;
        };
        category: {
            id: string;
            name: string;
        };
        categories: ({
            category: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            categoryId: string;
            createdAt: Date;
            categoryAdminId: string;
        })[];
    } & {
        schoolId: string;
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
    findOne(id: string, req: any): Promise<{
        school: {
            id: string;
            name: string;
            domain: string | null;
        };
        category: {
            id: string;
            name: string;
        };
        categories: ({
            category: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            categoryId: string;
            createdAt: Date;
            categoryAdminId: string;
        })[];
    } & {
        schoolId: string;
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
    create(createCategoryAdminDto: CreateCategoryAdminDto, req: any): Promise<{
        tempPassword: string;
        emailSent: boolean;
        emailError: string | null;
        school: {
            id: string;
            name: string;
            domain: string | null;
        };
        category: {
            id: string;
            name: string;
        };
        schoolId: string;
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
    updateCategories(id: string, updateDto: UpdateCategoryAdminCategoriesDto, req: any): Promise<{
        school: {
            id: string;
            name: string;
            domain: string | null;
        };
        category: {
            id: string;
            name: string;
        };
        categories: ({
            category: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            categoryId: string;
            createdAt: Date;
            categoryAdminId: string;
        })[];
    } & {
        schoolId: string;
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
    remove(id: string, req: any): Promise<{
        schoolId: string;
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
    ban(id: string, req: any): Promise<{
        schoolId: string;
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
    unban(id: string, req: any): Promise<{
        schoolId: string;
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
