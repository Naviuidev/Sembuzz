import { PrismaService } from '../../../prisma/prisma.service';
export declare class SchoolAdminUserHelpService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllForSchool(schoolId: string): Promise<({
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
