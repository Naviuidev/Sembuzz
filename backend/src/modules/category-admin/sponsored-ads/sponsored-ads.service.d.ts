import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSponsoredAdDto } from './dto/create-sponsored-ad.dto';
import { UpdateSponsoredAdDto } from './dto/update-sponsored-ad.dto';
export declare class CategoryAdminSponsoredAdsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getScope;
    create(categoryAdminId: string, dto: CreateSponsoredAdDto): Promise<{
        title: string | null;
        schoolId: string;
        id: string;
        categoryId: string | null;
        imageUrls: string | null;
        createdAt: Date;
        description: string | null;
        externalLink: string | null;
        categoryAdminId: string | null;
        adsAdminId: string | null;
        startAt: Date;
        endAt: Date;
    }>;
    listByCategoryAdmin(categoryAdminId: string): Promise<{
        title: string | null;
        id: string;
        imageUrls: string | null;
        createdAt: Date;
        description: string | null;
        externalLink: string | null;
        startAt: Date;
        endAt: Date;
    }[]>;
    getAnalytics(categoryAdminId: string, dateFrom?: string, dateTo?: string, sponsoredAdId?: string): Promise<{
        ads: {
            views: number;
            clicks: number;
            title: string | null;
            id: string;
            imageUrls: string | null;
            externalLink: string | null;
            startAt: Date;
            endAt: Date;
        }[];
        totals: {
            views: number;
            clicks: number;
        };
        byDay: {
            date: string;
            views: number;
            clicks: number;
        }[];
    }>;
    updateSchedule(categoryAdminId: string, id: string, dto: UpdateSponsoredAdDto): Promise<{
        title: string | null;
        schoolId: string;
        id: string;
        categoryId: string | null;
        imageUrls: string | null;
        createdAt: Date;
        description: string | null;
        externalLink: string | null;
        categoryAdminId: string | null;
        adsAdminId: string | null;
        startAt: Date;
        endAt: Date;
    }>;
    endNow(categoryAdminId: string, id: string): Promise<{
        title: string | null;
        schoolId: string;
        id: string;
        categoryId: string | null;
        imageUrls: string | null;
        createdAt: Date;
        description: string | null;
        externalLink: string | null;
        categoryAdminId: string | null;
        adsAdminId: string | null;
        startAt: Date;
        endAt: Date;
    }>;
    remove(categoryAdminId: string, id: string): Promise<{
        deleted: boolean;
    }>;
}
