import { PrismaService } from '../../prisma/prisma.service';
import type { AdminActionItemsResponse } from './admin-action-items.types';
export declare class AdminActionItemsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private buildResponse;
    private latestCreatedAt;
    private categoryIdsForAdmin;
    forSchoolAdmin(schoolId: string): Promise<AdminActionItemsResponse>;
    forCategoryAdmin(categoryAdminId: string, schoolId: string): Promise<AdminActionItemsResponse>;
    forSubCategoryAdmin(subCategoryAdminId: string): Promise<AdminActionItemsResponse>;
    forSuperAdmin(): Promise<AdminActionItemsResponse>;
    forAdsAdmin(): Promise<AdminActionItemsResponse>;
}
