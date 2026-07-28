import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../super-admin/schools/email.service';
import { MeetingsService } from '../../meetings/meetings.service';
import { CreateCategoryAdminQueryDto } from './dto/create-query.dto';
export declare class CategoryAdminQueriesService {
    private prisma;
    private emailService;
    private meetingsService;
    constructor(prisma: PrismaService, emailService: EmailService, meetingsService: MeetingsService);
    create(categoryAdminId: string, dto: CreateCategoryAdminQueryDto): Promise<{
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
    listFromSubcategoryAdmins(categoryAdminId: string): Promise<({
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
    replyToSubcategoryAdmin(queryId: string, message: string): Promise<{
        message: string;
    }>;
    listFromSchoolAdmins(categoryAdminId: string): Promise<({
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
    replyToSchoolAdmin(categoryAdminId: string, queryId: string, message: string): Promise<{
        message: string;
    }>;
    createToSubCategoryAdmin(categoryAdminId: string, dto: CreateCategoryAdminQueryDto): Promise<{
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
    createToSuperAdmin(categoryAdminId: string, dto: CreateCategoryAdminQueryDto): Promise<{
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
    listRaisedToSuperAdmin(categoryAdminId: string): Promise<{
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
    sendFollowUpToSuperAdmin(categoryAdminId: string, queryId: string, message: string): Promise<{
        message: string;
    }>;
    deleteFromSchoolAdmin(id: string, categoryAdminId: string): Promise<{
        deleted: boolean;
    }>;
    deleteFromSubcategoryAdmin(id: string, categoryAdminId: string): Promise<{
        deleted: boolean;
    }>;
    deleteRaisedToSuperAdmin(id: string, categoryAdminId: string): Promise<{
        deleted: boolean;
    }>;
}
