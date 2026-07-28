import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBannerAdDto } from './dto/create-banner-ad.dto';
import { UpdateBannerAdDto } from './dto/update-banner-ad.dto';
export declare class CategoryAdminBannerAdsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getCategoryAdminSchoolAndCategory;
    create(categoryAdminId: string, dto: CreateBannerAdDto): Promise<{
        schoolId: string;
        id: string;
        categoryId: string | null;
        createdAt: Date;
        externalLink: string | null;
        categoryAdminId: string | null;
        adsAdminId: string | null;
        imageUrl: string;
        startAt: Date;
        endAt: Date;
    }>;
    listByCategoryAdmin(categoryAdminId: string): Promise<{
        id: string;
        createdAt: Date;
        externalLink: string | null;
        imageUrl: string;
        startAt: Date;
        endAt: Date;
    }[]>;
    getAnalytics(categoryAdminId: string, dateFrom?: string, dateTo?: string, bannerAdId?: string): Promise<{
        ads: {
            views: number;
            clicks: number;
            id: string;
            externalLink: string | null;
            imageUrl: string;
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
    updateSchedule(categoryAdminId: string, bannerAdId: string, dto: UpdateBannerAdDto): Promise<{
        schoolId: string;
        id: string;
        categoryId: string | null;
        createdAt: Date;
        externalLink: string | null;
        categoryAdminId: string | null;
        adsAdminId: string | null;
        imageUrl: string;
        startAt: Date;
        endAt: Date;
    }>;
    endNow(categoryAdminId: string, bannerAdId: string): Promise<{
        schoolId: string;
        id: string;
        categoryId: string | null;
        createdAt: Date;
        externalLink: string | null;
        categoryAdminId: string | null;
        adsAdminId: string | null;
        imageUrl: string;
        startAt: Date;
        endAt: Date;
    }>;
    remove(categoryAdminId: string, bannerAdId: string): Promise<{
        deleted: boolean;
    }>;
}
