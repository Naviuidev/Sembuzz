import { PendingUsersService } from './pending-users.service';
import { AskReuploadDto } from './dto/ask-reupload.dto';
export declare class PendingUsersController {
    private readonly pendingUsersService;
    constructor(pendingUsersService: PendingUsersService);
    list(req: {
        user: {
            sub: string;
            schoolId: string;
        };
    }): Promise<{
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
    approve(id: string, req: {
        user: {
            sub: string;
            schoolId: string;
        };
    }): Promise<{
        success: boolean;
    }>;
    reject(id: string, req: {
        user: {
            sub: string;
            schoolId: string;
        };
    }): Promise<{
        success: boolean;
    }>;
    requestDocs(id: string, req: {
        user: {
            sub: string;
            schoolId: string;
        };
    }): Promise<{
        success: boolean;
    }>;
    askReupload(id: string, body: AskReuploadDto, req: {
        user: {
            sub: string;
            schoolId: string;
        };
    }): Promise<{
        success: boolean;
    }>;
}
