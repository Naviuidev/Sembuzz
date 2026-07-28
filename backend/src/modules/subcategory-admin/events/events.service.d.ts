import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
export interface AnalyzeBannerResult {
    title: string;
    description: string;
    externalLink: string;
}
export declare class EventsService {
    private config;
    private prisma;
    private openai;
    constructor(config: ConfigService, prisma: PrismaService);
    create(subCategoryAdminId: string, dto: CreateEventDto): Promise<{
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    }>;
    findPendingBySubCategoryAdmin(subCategoryAdminId: string): Promise<({
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    })[]>;
    findRevertedBySubCategoryAdmin(subCategoryAdminId: string): Promise<({
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    })[]>;
    findApprovedBySubCategoryAdmin(subCategoryAdminId: string): Promise<({
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        imageUrls: string | null;
        status: string;
        revertNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        externalLink: string | null;
        commentsEnabled: boolean;
    })[]>;
    analyzeBannerImage(imageBuffer: Buffer, mimeType: string): Promise<AnalyzeBannerResult>;
}
