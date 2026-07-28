import { PrismaService } from '../../../prisma/prisma.service';
import { CreateQueryDto } from '../dto/create-query.dto';
import { EmailService } from '../../super-admin/schools/email.service';
import { MeetingsService } from '../../meetings/meetings.service';
export declare class QueriesService {
    private prisma;
    private emailService;
    private meetingsService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, meetingsService: MeetingsService);
    create(adminId: string, createQueryDto: CreateQueryDto): Promise<{
        schoolAdmin: {
            school: {
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
    }>;
    findAll(adminId?: string): Promise<({
        schoolAdmin: {
            school: {
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
    findOne(id: string): Promise<({
        schoolAdmin: {
            school: {
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
    }) | null>;
    updateStatus(id: string, status: string): Promise<{
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
    }>;
    sendReply(id: string, message: string): Promise<{
        message: string;
    }>;
    listFromCategoryAdmins(schoolAdminId: string): Promise<({
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
    })[]>;
    replyToCategoryAdmin(queryId: string, message: string): Promise<{
        message: string;
    }>;
    createToCategoryAdmin(adminId: string, dto: CreateQueryDto): Promise<{
        school: {
            name: string;
        };
        schoolAdmin: {
            name: string;
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
    }>;
    createToSubCategoryAdmin(adminId: string, dto: CreateQueryDto): Promise<{
        school: {
            name: string;
        };
        schoolAdmin: {
            name: string;
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
    }>;
    listFromSubCategoryAdmins(schoolAdminId: string): Promise<({
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
    })[]>;
    deleteRaisedToSuperAdmin(id: string, schoolAdminId: string): Promise<{
        deleted: boolean;
    }>;
    deleteFromCategoryAdmin(id: string, schoolAdminId: string): Promise<{
        deleted: boolean;
    }>;
    replyToSubcategoryAdmin(schoolAdminId: string, queryId: string, message: string): Promise<{
        message: string;
    }>;
    deleteFromSubcategoryAdmin(id: string, schoolAdminId: string): Promise<{
        deleted: boolean;
    }>;
}
