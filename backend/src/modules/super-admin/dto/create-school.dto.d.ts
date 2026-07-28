export declare class CreateSchoolDto {
    schoolName: string;
    country: string;
    state?: string;
    city: string;
    domain: string;
    image?: string;
    selectedFeatures: string[];
    adminEmail: string;
    /** Required only when "ADS" is in selectedFeatures. Email for the Ads Admin (manages banner/sponsored ads). */
    adsAdminEmail?: string;
    tenure?: number;
}
