import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateSubCategoryDto } from '../dto/create-subcategory.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { UpdateSubCategoryDto } from '../dto/update-subcategory.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(req: any): Promise<({
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
    findOne(id: string, req: any): Promise<{
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
    create(createCategoryDto: CreateCategoryDto, req: any): Promise<{
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
    update(id: string, updateCategoryDto: UpdateCategoryDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        schoolId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    createSubCategory(createSubCategoryDto: CreateSubCategoryDto, req: any): Promise<{
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    updateSubCategory(id: string, updateSubCategoryDto: UpdateSubCategoryDto, req: any): Promise<{
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    removeSubCategory(id: string, req: any): Promise<{
        id: string;
        categoryId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
}
