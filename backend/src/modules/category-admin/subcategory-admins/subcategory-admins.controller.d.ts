import { SubCategoryAdminsService } from './subcategory-admins.service';
import { CreateSubCategoryAdminDto } from '../dto/create-subcategory-admin.dto';
import { UpdateSubCategoryAdminSubCategoriesDto } from '../dto/update-subcategory-admin-subcategories.dto';
export declare class SubCategoryAdminsController {
    private readonly subCategoryAdminsService;
    constructor(subCategoryAdminsService: SubCategoryAdminsService);
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
        subCategory: {
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
        subCategory: {
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
    }>;
    create(createSubCategoryAdminDto: CreateSubCategoryAdminDto, req: any): Promise<{
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
        subCategory: {
            id: string;
            name: string;
        };
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
    updateSubCategories(id: string, updateDto: UpdateSubCategoryAdminSubCategoriesDto, req: any): Promise<{
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
    }>;
    remove(id: string, req: any): Promise<{
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
