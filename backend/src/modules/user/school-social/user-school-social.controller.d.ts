import { PrismaService } from '../../../prisma/prisma.service';
export declare class UserSchoolSocialController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
        link: string;
        icon: string;
        platformId: string;
        platformName: string;
        pageName: string;
    }[]>;
}
