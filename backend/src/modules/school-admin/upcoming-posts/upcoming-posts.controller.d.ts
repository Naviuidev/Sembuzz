import { UpcomingPostsService } from './upcoming-posts.service';
import { CreateUpcomingPostDto } from './dto/create-upcoming-post.dto';
import { UpdateUpcomingPostDto } from './dto/update-upcoming-post.dto';
export declare class UpcomingPostsController {
    private readonly service;
    constructor(service: UpcomingPostsService);
    uploadImage(file: Express.Multer.File): {
        url: string;
    };
    create(req: {
        user: {
            schoolId: string;
        };
    }, dto: CreateUpcomingPostDto): Promise<{
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
    list(req: {
        user: {
            schoolId: string;
        };
    }): Promise<({
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
    getOne(id: string, req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
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
    update(id: string, req: {
        user: {
            schoolId: string;
        };
    }, dto: UpdateUpcomingPostDto): Promise<{
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
    remove(id: string, req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        deleted: boolean;
    }>;
}
