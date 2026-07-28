import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../super-admin/schools/email.service';
import { MeetingsService } from '../../meetings/meetings.service';
import { CreateSubCategoryAdminQueryDto } from './dto/create-query.dto';
export declare class SubCategoryAdminQueriesService {
    private prisma;
    private emailService;
    private meetingsService;
    constructor(prisma: PrismaService, emailService: EmailService, meetingsService: MeetingsService);
    create(subCategoryAdminId: string, dto: CreateSubCategoryAdminQueryDto): Promise<{
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
    listFromSchoolAdmins(subCategoryAdminId: string): Promise<({
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
    listFromCategoryAdmins(subCategoryAdminId: string): Promise<({
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
    createToSchoolAdmin(subCategoryAdminId: string, dto: CreateSubCategoryAdminQueryDto): Promise<{
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
    createToSuperAdmin(subCategoryAdminId: string, dto: CreateSubCategoryAdminQueryDto): Promise<{
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
    replyToSchoolAdmin(subCategoryAdminId: string, queryId: string, message: string): Promise<{
        message: string;
    }>;
    replyToCategoryAdmin(subCategoryAdminId: string, queryId: string, message: string): Promise<{
        message: string;
    }>;
    deleteFromSchoolAdmin(id: string, subCategoryAdminId: string): Promise<{
        deleted: boolean;
    }>;
    deleteFromCategoryAdmin(id: string, subCategoryAdminId: string): Promise<{
        deleted: boolean;
    }>;
}
