import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSponsoredAdDto } from './dto/create-sponsored-ad.dto';
import { UpdateSponsoredAdDto } from './dto/update-sponsored-ad.dto';
export declare class AdsAdminSponsoredAdsService {
    private prisma;
    constructor(prisma: PrismaService);
    /** Cast so generated delegates (adsAdmin, sponsoredAd.adsAdminId) are accepted; run `npx prisma generate` so runtime client matches. */
    private get client();
    private getSchoolId;
    create(adsAdminId: string, dto: CreateSponsoredAdDto): Promise<any>;
    listByAdsAdmin(adsAdminId: string): Promise<any>;
    getAnalytics(adsAdminId: string, dateFrom?: string, dateTo?: string, sponsoredAdId?: string): Promise<{
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
    updateSchedule(adsAdminId: string, id: string, dto: UpdateSponsoredAdDto): Promise<any>;
    endNow(adsAdminId: string, id: string): Promise<any>;
    remove(adsAdminId: string, id: string): Promise<{
        deleted: boolean;
    }>;
}
