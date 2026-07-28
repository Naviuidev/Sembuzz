import { UserHelpService } from './user-help.service';
import { CreateUserHelpDto } from './dto/create-user-help.dto';
export declare class UserHelpController {
    private readonly userHelpService;
    constructor(userHelpService: UserHelpService);
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateUserHelpDto): Promise<{
        schoolId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        userId: string;
    }>;
    findMyQueries(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        schoolId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        userId: string;
    }[]>;
}
