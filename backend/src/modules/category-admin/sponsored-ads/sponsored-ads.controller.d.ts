import { CategoryAdminSponsoredAdsService } from './sponsored-ads.service';
import { CreateSponsoredAdDto } from './dto/create-sponsored-ad.dto';
import { UpdateSponsoredAdDto } from './dto/update-sponsored-ad.dto';
export declare class CategoryAdminSponsoredAdsController {
    private readonly sponsoredAdsService;
    constructor(sponsoredAdsService: CategoryAdminSponsoredAdsService);
    uploadImage(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateSponsoredAdDto): Promise<{
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
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        title: string | null;
        id: string;
        imageUrls: string | null;
        createdAt: Date;
        description: string | null;
        externalLink: string | null;
        startAt: Date;
        endAt: Date;
    }[]>;
    getAnalytics(req: {
        user: {
            sub: string;
        };
    }, dateFrom?: string, dateTo?: string, sponsoredAdId?: string): Promise<{
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
    update(req: {
        user: {
            sub: string;
        };
    }, id: string, dto: UpdateSponsoredAdDto): Promise<{
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
    endNow(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
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
    delete(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        deleted: boolean;
    }>;
}
