import { EmailService } from '../schools/email.service';
import { SupportRequestDto } from '../dto/support-request.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { MeetingsService } from '../../meetings/meetings.service';
export declare class SupportService {
    private emailService;
    private prisma;
    private meetingsService;
    constructor(emailService: EmailService, prisma: PrismaService, meetingsService: MeetingsService);
    sendSupportRequest(supportRequestDto: SupportRequestDto, superAdminId?: string, superAdminEmail?: string): Promise<{
        message: string;
        meetingLink: string | undefined;
    }>;
    findAll(superAdminId?: string): Promise<({
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
    updateStatus(id: string, status: string): Promise<{
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
    sendReply(id: string, message: string): Promise<{
        message: string;
    }>;
    findFromSchoolAdmins(): Promise<({
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
    findFromCategoryAdmins(): Promise<({
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
    findFromSubcategoryAdmins(): Promise<({
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
    replyToSchoolAdminQuery(id: string, message: string): Promise<{
        message: string;
    }>;
    replyToCategoryAdminQuery(id: string, message: string): Promise<{
        message: string;
    }>;
    replyToSubcategoryAdminQuery(id: string, message: string): Promise<{
        message: string;
    }>;
}
