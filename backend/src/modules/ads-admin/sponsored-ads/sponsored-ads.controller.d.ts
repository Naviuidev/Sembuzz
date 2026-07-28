import { AdsAdminSponsoredAdsService } from './sponsored-ads.service';
import { CreateSponsoredAdDto } from './dto/create-sponsored-ad.dto';
import { UpdateSponsoredAdDto } from './dto/update-sponsored-ad.dto';
export declare class AdsAdminSponsoredAdsController {
    private readonly sponsoredAdsService;
    constructor(sponsoredAdsService: AdsAdminSponsoredAdsService);
    uploadImage(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateSponsoredAdDto): Promise<any>;
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<any>;
    getAnalytics(req: {
        user: {
            sub: string;
        };
    }, dateFrom?: string, dateTo?: string, sponsoredAdId?: string): Promise<{
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
    }, id: string, dto: UpdateSponsoredAdDto): Promise<any>;
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
