import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateSubCategoryDto } from '../dto/create-subcategory.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { UpdateSubCategoryDto } from '../dto/update-subcategory.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(schoolId: string): Promise<({
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
    findOne(id: string, schoolId: string): Promise<{
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
    create(schoolId: string, createCategoryDto: CreateCategoryDto): Promise<{
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
    update(id: string, schoolId: string, updateCategoryDto: UpdateCategoryDto): Promise<{
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
    remove(id: string, schoolId: string): Promise<{
        schoolId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    createSubCategory(schoolId: string, createSubCategoryDto: CreateSubCategoryDto): Promise<{
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    updateSubCategory(id: string, schoolId: string, updateSubCategoryDto: UpdateSubCategoryDto): Promise<{
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    removeSubCategory(id: string, schoolId: string): Promise<{
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
}
