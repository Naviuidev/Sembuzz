import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../super-admin/schools/email.service';
export declare class PendingUsersService {
    private prisma;
    private emailService;
    private jwtService;
    constructor(prisma: PrismaService, emailService: EmailService, jwtService: JwtService);
    findPendingForSchool(schoolId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        profilePicUrl: string | null;
        verificationDocUrl: string | null;
        additionalVerificationDocUrl: string | null;
    }[]>;
    approve(userId: string, schoolId: string): Promise<{
        success: boolean;
    }>;
    reject(userId: string, schoolId: string): Promise<{
        success: boolean;
    }>;
    requestDocs(userId: string, schoolId: string): Promise<{
        success: boolean;
    }>;
    askReupload(userId: string, schoolId: string, message: string, type?: 'reupload' | 'additional'): Promise<{
        success: boolean;
    }>;
}
