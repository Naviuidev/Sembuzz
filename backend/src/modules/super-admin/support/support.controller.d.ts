import { SupportService } from './support.service';
import { SupportRequestDto } from '../dto/support-request.dto';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    sendSupportRequest(supportRequestDto: SupportRequestDto, req: any): Promise<{
        message: string;
        meetingLink: string | undefined;
    }>;
    getQueries(req: any): Promise<({
        superAdmin: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
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
        superAdminId: string;
    })[]>;
    getQueriesFromSchoolAdmins(): Promise<({
        schoolAdmin: {
            school: {
                id: string;
                refNum: string;
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
    getQueriesFromCategoryAdmins(): Promise<({
        categoryAdmin: {
            school: {
                id: string;
                name: string;
            };
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
    })[]>;
    getQueriesFromSubcategoryAdmins(): Promise<({
        subCategoryAdmin: {
            school: {
                id: string;
                name: string;
            };
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
        customMessage: string | null;
        attachmentUrl: string | null;
    })[]>;
    updateStatus(id: string, body: {
        status: string;
    }): Promise<{
        id: string;
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
        superAdminId: string;
    }>;
    sendReply(id: string, body: {
        message: string;
    }): Promise<{
        message: string;
    }>;
    replyToSchoolAdmin(id: string, body: {
        message: string;
    }): Promise<{
        message: string;
    }>;
    replyToCategoryAdmin(id: string, body: {
        message: string;
    }): Promise<{
        message: string;
    }>;
    replyToSubcategoryAdmin(id: string, body: {
        message: string;
    }): Promise<{
        message: string;
    }>;
    deleteFromSchoolAdmins(id: string): Promise<{
        deleted: boolean;
    }>;
    deleteFromCategoryAdmins(id: string): Promise<{
        deleted: boolean;
    }>;
    deleteFromSubcategoryAdmins(id: string): Promise<{
        deleted: boolean;
    }>;
    deleteSuperAdminQuery(id: string): Promise<{
        deleted: boolean;
    }>;
}
