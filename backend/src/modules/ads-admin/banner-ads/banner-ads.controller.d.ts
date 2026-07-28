import { AdsAdminBannerAdsService } from './banner-ads.service';
import { CreateBannerAdDto } from './dto/create-banner-ad.dto';
import { UpdateBannerAdDto } from './dto/update-banner-ad.dto';
export declare class AdsAdminBannerAdsController {
    private readonly bannerAdsService;
    constructor(bannerAdsService: AdsAdminBannerAdsService);
    uploadBannerImage(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateBannerAdDto): Promise<any>;
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<any>;
    getAnalytics(req: {
        user: {
            sub: string;
        };
    }, dateFrom?: string, dateTo?: string, bannerAdId?: string): Promise<{
        ads: any;
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
    }, id: string, dto: UpdateBannerAdDto): Promise<any>;
    endNow(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<any>;
    delete(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        deleted: boolean;
    }>;
}
