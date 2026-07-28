import { PrismaService } from '../../../prisma/prisma.service';
export declare class SchoolAdminStudentsService {
    private prisma;
    constructor(prisma: PrismaService);
    private userSelect;
    findApprovedForSchool(schoolId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        name: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        profilePicUrl: string | null;
        registrationMethod: string | null;
        verificationDocUrl: string | null;
        additionalVerificationDocUrl: string | null;
    }[]>;
    findAutomatedForSchool(schoolId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        name: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        profilePicUrl: string | null;
        registrationMethod: string | null;
        verificationDocUrl: string | null;
        additionalVerificationDocUrl: string | null;
    }[]>;
    ban(userId: string, schoolId: string): Promise<{
        success: boolean;
    }>;
    unban(userId: string, schoolId: string): Promise<{
        success: boolean;
    }>;
}
