import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../super-admin/schools/email.service';
export type MembershipStatus = 'pending' | 'approved' | 'banned';
export declare class CategoryAdminClubGroupMembershipsService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    listForSchool(schoolId: string, status: MembershipStatus): Promise<{
        school: {
            id: string;
            name: string;
        };
        user: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            profilePicUrl: string | null;
            registrationMethod: string | null;
        };
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        reviewedAt: Date | null;
        groupChat: {
            id: string;
            icon: string;
            pageName: string;
            clubKey: string;
        };
        reviewedBy: {
            id: string;
            name: string;
            email: string;
        } | null;
    }[]>;
    private getMembershipForSchool;
    approve(membershipId: string, schoolId: string, categoryAdminId: string): Promise<{
        id: string;
        status: string;
    }>;
    private sendJoinApprovedEmail;
    ban(membershipId: string, schoolId: string, categoryAdminId: string): Promise<{
        id: string;
        status: string;
    }>;
}
