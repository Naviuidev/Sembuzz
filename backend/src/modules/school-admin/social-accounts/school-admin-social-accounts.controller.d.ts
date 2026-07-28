import { SchoolAdminSocialAccountsService } from './school-admin-social-accounts.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
export declare class SchoolAdminSocialAccountsController {
    private readonly service;
    constructor(service: SchoolAdminSocialAccountsService);
    uploadIcon(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    list(req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        schoolId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        link: string;
        icon: string;
        platformId: string;
        platformName: string;
        pageName: string;
    }[]>;
    createBulk(req: {
        user: {
            schoolId: string;
        };
    }, body: {
        accounts: CreateSocialAccountDto[];
    }): Promise<{
        schoolId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        link: string;
        icon: string;
        platformId: string;
        platformName: string;
        pageName: string;
    }[]>;
    create(req: {
        user: {
            schoolId: string;
        };
    }, dto: CreateSocialAccountDto): Promise<{
        schoolId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        link: string;
        icon: string;
        platformId: string;
        platformName: string;
        pageName: string;
    }>;
    update(id: string, req: {
        user: {
            schoolId: string;
        };
    }, dto: UpdateSocialAccountDto): Promise<{
        schoolId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        link: string;
        icon: string;
        platformId: string;
        platformName: string;
        pageName: string;
    }>;
    remove(id: string, req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        success: boolean;
    }>;
}
