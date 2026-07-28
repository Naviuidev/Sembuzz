import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSubCategoryAdminDto } from '../dto/create-subcategory-admin.dto';
import { UpdateSubCategoryAdminSubCategoriesDto } from '../dto/update-subcategory-admin-subcategories.dto';
import { EmailService } from '../../super-admin/schools/email.service';
export declare class SubCategoryAdminsService {
    private prisma;
    private emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    generateTemporaryPassword(): Promise<string>;
    /** All category IDs this category admin has access to (primary + junction table). */
    private getCategoryAdminCategoryIds;
    findAll(categoryId: string, categoryAdminId: string): Promise<({
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
    findOne(id: string, categoryId: string, categoryAdminId: string): Promise<{
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
    create(categoryId: string, categoryAdminId: string, createSubCategoryAdminDto: CreateSubCategoryAdminDto): Promise<{
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
    updateSubCategories(id: string, categoryId: string, categoryAdminId: string, updateDto: UpdateSubCategoryAdminSubCategoriesDto): Promise<{
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
    remove(id: string, categoryId: string, categoryAdminId: string): Promise<{
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
