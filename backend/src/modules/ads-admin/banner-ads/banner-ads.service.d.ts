import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBannerAdDto } from './dto/create-banner-ad.dto';
import { UpdateBannerAdDto } from './dto/update-banner-ad.dto';
export declare class AdsAdminBannerAdsService {
    private prisma;
    constructor(prisma: PrismaService);
    /** Cast so generated delegates (adsAdmin, bannerAd.adsAdminId) are accepted; run `npx prisma generate` so runtime client matches. */
    private get client();
    private getSchoolId;
    create(adsAdminId: string, dto: CreateBannerAdDto): Promise<any>;
    listByAdsAdmin(adsAdminId: string): Promise<any>;
    getAnalytics(adsAdminId: string, dateFrom?: string, dateTo?: string, bannerAdId?: string): Promise<{
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
    updateSchedule(adsAdminId: string, bannerAdId: string, dto: UpdateBannerAdDto): Promise<any>;
    endNow(adsAdminId: string, bannerAdId: string): Promise<any>;
    remove(adsAdminId: string, bannerAdId: string): Promise<{
        deleted: boolean;
    }>;
}
