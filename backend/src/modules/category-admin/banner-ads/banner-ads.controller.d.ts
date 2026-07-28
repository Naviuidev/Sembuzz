import { CategoryAdminBannerAdsService } from './banner-ads.service';
import { CreateBannerAdDto } from './dto/create-banner-ad.dto';
import { UpdateBannerAdDto } from './dto/update-banner-ad.dto';
export declare class CategoryAdminBannerAdsController {
    private readonly bannerAdsService;
    constructor(bannerAdsService: CategoryAdminBannerAdsService);
    uploadBannerImage(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateBannerAdDto): Promise<{
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
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
        createdAt: Date;
        externalLink: string | null;
        imageUrl: string;
        startAt: Date;
        endAt: Date;
    }[]>;
    getAnalytics(req: {
        user: {
            sub: string;
        };
    }, dateFrom?: string, dateTo?: string, bannerAdId?: string): Promise<{
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
    update(req: {
        user: {
            sub: string;
        };
    }, id: string, dto: UpdateBannerAdDto): Promise<{
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
    endNow(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
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
    delete(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        deleted: boolean;
    }>;
}
