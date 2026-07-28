import { SchoolAdminPostsService } from './posts.service';
import { UpdatePostDto } from './dto/update-post.dto';
export declare class SchoolAdminPostsController {
    private readonly postsService;
    constructor(postsService: SchoolAdminPostsService);
    list(req: {
        user: {
            schoolId: string;
        };
    }): Promise<({
        subCategory: {
            category: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    })[]>;
    getOne(id: string, req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        subCategory: {
            category: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    }>;
    uploadImage(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    update(id: string, body: UpdatePostDto, req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        subCategory: {
            category: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    }>;
    delete(id: string, req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        deleted: boolean;
    }>;
}
