import { CategoryAdminQueriesService } from './queries.service';
import { CreateCategoryAdminQueryDto } from './dto/create-query.dto';
export declare class CategoryAdminQueriesController {
    private readonly queriesService;
    constructor(queriesService: CategoryAdminQueriesService);
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateCategoryAdminQueryDto): Promise<{
        school: {
            name: string;
        };
        categoryAdmin: {
            name: string;
            email: string;
        };
    } & {
        schoolId: string;
        id: string;
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
    }>;
    uploadFile(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
    })[]>;
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
    createToSubCategoryAdmin(req: {
        user: {
            sub: string;
        };
    }, dto: CreateCategoryAdminQueryDto): Promise<{
        category: {
            name: string;
        };
        categoryAdmin: {
            name: string;
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
    }>;
    createToSuperAdmin(req: {
        user: {
            sub: string;
        };
    }, dto: CreateCategoryAdminQueryDto): Promise<{
        categoryAdmin: {
            name: string;
            email: string;
        };
    } & {
        id: string;
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
        customMessage: string | null;
        attachmentUrl: string | null;
    }>;
    listFromSubcategoryAdmins(req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
    })[]>;
    listRaisedToSuperAdmin(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
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
        customMessage: string | null;
        attachmentUrl: string | null;
    }[]>;
    sendFollowUpToSuperAdmin(id: string, req: {
        user: {
            sub: string;
        };
    }, body: {
        message: string;
    }): Promise<{
        message: string;
    }>;
    replyToSubcategoryAdmin(id: string, body: {
        message: string;
    }): Promise<{
        message: string;
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
    deleteFromSchoolAdmin(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        deleted: boolean;
    }>;
    deleteFromSubcategoryAdmin(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        deleted: boolean;
    }>;
    deleteRaisedToSuperAdmin(id: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        deleted: boolean;
    }>;
}
