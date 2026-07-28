import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUpcomingPostDto } from './dto/create-upcoming-post.dto';
import { UpdateUpcomingPostDto } from './dto/update-upcoming-post.dto';
export declare class UpcomingPostsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(schoolId: string, dto: CreateUpcomingPostDto): Promise<{
        school: {
            id: string;
            name: string;
            image: string | null;
        };
        category: {
            id: string;
            name: string;
        };
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        categoryId: string;
        imageUrls: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        scheduledTo: Date;
    }>;
    findAllForSchool(schoolId: string): Promise<({
        category: {
            id: string;
            name: string;
        };
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        categoryId: string;
        imageUrls: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        scheduledTo: Date;
    })[]>;
    findOne(id: string, schoolId: string): Promise<{
        school: {
            id: string;
            name: string;
            image: string | null;
        };
        category: {
            id: string;
            name: string;
        };
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        categoryId: string;
        imageUrls: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        scheduledTo: Date;
    }>;
    update(id: string, schoolId: string, dto: UpdateUpcomingPostDto): Promise<{
        school: {
            id: string;
            name: string;
            image: string | null;
        };
        category: {
            id: string;
            name: string;
        };
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        categoryId: string;
        imageUrls: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        scheduledTo: Date;
    }>;
    remove(id: string, schoolId: string): Promise<{
        deleted: boolean;
    }>;
    private validateCategorySubCategory;
}
