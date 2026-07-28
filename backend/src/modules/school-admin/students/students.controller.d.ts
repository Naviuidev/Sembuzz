import { SchoolAdminStudentsService } from './students.service';
export declare class SchoolAdminStudentsController {
    private readonly studentsService;
    constructor(studentsService: SchoolAdminStudentsService);
    listApproved(req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
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
    listAutomated(req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
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
    ban(id: string, req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        success: boolean;
    }>;
    unban(id: string, req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        success: boolean;
    }>;
}
