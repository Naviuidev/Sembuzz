import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
export declare class SchoolAdminSocialAccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllForSchool(schoolId: string): Promise<{
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
    create(schoolId: string, dto: CreateSocialAccountDto): Promise<{
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
    createMany(schoolId: string, dtos: CreateSocialAccountDto[]): Promise<{
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
    update(id: string, schoolId: string, dto: UpdateSocialAccountDto): Promise<{
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
    remove(id: string, schoolId: string): Promise<{
        success: boolean;
    }>;
    private findOne;
}
