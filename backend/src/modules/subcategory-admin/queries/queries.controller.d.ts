import { SubCategoryAdminQueriesService } from './queries.service';
import { CreateSubCategoryAdminQueryDto } from './dto/create-query.dto';
export declare class SubCategoryAdminQueriesController {
    private readonly queriesService;
    constructor(queriesService: SubCategoryAdminQueriesService);
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateSubCategoryAdminQueryDto): Promise<{
        subCategoryAdmin: {
            category: {
                name: string;
            };
            subCategory: {
                name: string;
            };
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
        };
    } & {
        id: string;
        subCategoryAdminId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        timeZone: string | null;
        type: string;
        meetingLink: string | null;
        meetingType: string | null;
        meetingDate: Date | null;
        timeSlot: string | null;
        attachmentUrl: string | null;
    }>;
    listFromSchoolAdmins(req: {
        user: {
            sub: string;
        };
    }): Promise<({
        schoolAdmin: {
            school: {
                name: string;
            };
        } & {
            schoolId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            email: string;
            password: string;
            isFirstLogin: boolean;
        };
    } & {
        schoolId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        timeZone: string | null;
        type: string;
        meetingLink: string | null;
        date: Date | null;
        meetingType: string | null;
        timeSlot: string | null;
        schoolAdminId: string;
        attachmentUrl: string | null;
    })[]>;
    listFromCategoryAdmins(req: {
        user: {
            sub: string;
        };
    }): Promise<({
        categoryAdmin: {
            category: {
                name: string;
            };
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
        };
    } & {
        id: string;
        categoryId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        categoryAdminId: string;
        timeZone: string | null;
        type: string;
        meetingLink: string | null;
        meetingType: string | null;
        meetingDate: Date | null;
        timeSlot: string | null;
        attachmentUrl: string | null;
    })[]>;
    createToSchoolAdmin(req: {
        user: {
            sub: string;
        };
    }, dto: CreateSubCategoryAdminQueryDto): Promise<{
        subCategoryAdmin: {
            name: string;
        };
    } & {
        schoolId: string;
        id: string;
        subCategoryAdminId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        timeZone: string | null;
        type: string;
        meetingLink: string | null;
        meetingType: string | null;
        meetingDate: Date | null;
        timeSlot: string | null;
        attachmentUrl: string | null;
    }>;
    createToSuperAdmin(req: {
        user: {
            sub: string;
        };
    }, dto: CreateSubCategoryAdminQueryDto): Promise<{
        subCategoryAdmin: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        subCategoryAdminId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        timeZone: string | null;
        type: string;
        meetingLink: string | null;
        meetingType: string | null;
        meetingDate: Date | null;
        timeSlot: string | null;
        customMessage: string | null;
        attachmentUrl: string | null;
    }>;
    replyToSchoolAdmin(id: string, req: {
        user: {
            sub: string;
        };
    }, body: {
        message: string;
    }): Promise<{
        message: string;
    }>;
    replyToCategoryAdmin(id: string, req: {
        user: {
            sub: string;
        };
    }, body: {
        message: string;
    }): Promise<{
        message: string;
    }>;
    deleteFromSchoolAdmin(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        deleted: boolean;
    }>;
    deleteFromCategoryAdmin(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        deleted: boolean;
    }>;
    uploadFile(file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
