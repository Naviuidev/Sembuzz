import { PrismaService } from '../../../prisma/prisma.service';
export declare class UserHelpService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, message: string): Promise<{
        schoolId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        userId: string;
    }>;
    findMyQueries(userId: string): Promise<{
        schoolId: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        message: string;
        userId: string;
    }[]>;
}
