import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryAdminDto } from '../dto/create-category-admin.dto';
import { UpdateCategoryAdminCategoriesDto } from '../dto/update-category-admin-categories.dto';
import { EmailService } from '../../super-admin/schools/email.service';
export declare class CategoryAdminsService {
    private prisma;
    private emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    generateTemporaryPassword(): Promise<string>;
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
    findOne(id: string, schoolId: string): Promise<{
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
    create(schoolId: string, createCategoryAdminDto: CreateCategoryAdminDto): Promise<{
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
    updateCategories(id: string, schoolId: string, updateDto: UpdateCategoryAdminCategoriesDto): Promise<{
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
    remove(id: string, schoolId: string): Promise<{
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
    ban(id: string, schoolId: string): Promise<{
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
    unban(id: string, schoolId: string): Promise<{
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
