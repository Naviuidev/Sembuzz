import { SchoolAdminUserHelpService } from './school-admin-user-help.service';
export declare class SchoolAdminUserHelpController {
    private readonly userHelpService;
    constructor(userHelpService: SchoolAdminUserHelpService);
    list(req: {
        user: {
            schoolId: string;
        };
    }): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        schoolId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        userId: string;
    })[]>;
}
