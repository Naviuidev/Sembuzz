import { PrismaService } from './prisma/prisma.service';
import { PublishedBlogsService } from './published-blogs.service';
export declare class EventsPublicController {
    private prisma;
    private publishedBlogs;
    constructor(prisma: PrismaService, publishedBlogs: PublishedBlogsService);
    getCategoriesBySchool(schoolId: string): Promise<({
        subcategories: {
            id: string;
            name: string;
        }[];
    } & {
        schoolId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    })[]>;
    /** Same Event table as category-admin/events/approved; returns all approved events (all schools) when no schoolId. Used by public /events page (guest + logged-in). */
    findApproved(schoolId?: string, subCategoryIdsStr?: string): Promise<({
        school: {
            name: string;
            image: string | null;
        };
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
    /** Upcoming/scheduled posts by date/range (school admin created). Public, no auth.
     * - date=YYYY-MM-DD (single day)
     * - from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive range)
     */
    getUpcomingByDate(dateStr?: string, fromStr?: string, toStr?: string): Promise<({
        school: {
            id: string;
            name: string;
            image: string | null;
        };
        category: {
            id: string;
            name: string;
        };
        subCategory: {
            id: string;
            name: string;
        };
    } & {
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        categoryId: string;
        imageUrls: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        scheduledTo: Date;
    })[]>;
    /** Public like, comment, and saved counts for event IDs (no auth). Optional dateFrom/dateTo (YYYY-MM-DD) filter engagement by when the action happened. */
    getEngagementCounts(eventIdsStr?: string, dateFromStr?: string, dateToStr?: string): Promise<{
        likes: Record<string, number>;
        commentCounts: Record<string, number>;
        savedCounts: Record<string, number>;
    }>;
    /** Active banner ads: startAt <= now <= endAt. Optional schoolId to filter by school. For guests and logged-in users. */
    getActiveBannerAds(schoolId?: string): Promise<{
        schoolId: string;
        id: string;
        createdAt: Date;
        externalLink: string | null;
        imageUrl: string;
        startAt: Date;
        endAt: Date;
    }[]>;
    /** Record a view for a banner ad (public, no auth). Ad must be active. */
    recordBannerAdView(id: string): Promise<{
        ok: boolean;
    }>;
    /** Record a click for a banner ad and return redirect URL (public, no auth). Ad must be active. */
    recordBannerAdClick(id: string): Promise<{
        ok: boolean;
        redirectUrl?: string | null;
    }>;
    /** Active sponsored ads: startAt <= now <= endAt. Optional schoolId. Same UI as news, light blue bg, "Ad" badge. */
    getActiveSponsoredAds(schoolId?: string): Promise<({
        school: {
            id: string;
            name: string;
            image: string | null;
        };
    } & {
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
    })[]>;
    recordSponsoredAdView(id: string): Promise<{
        ok: boolean;
    }>;
    recordSponsoredAdClick(id: string): Promise<{
        ok: boolean;
        redirectUrl?: string | null;
    }>;
    /** Published blogs — delegates to PublishedBlogsService (same as GET /public/blogs). */
    blogsPublished(schoolId?: string, q?: string, fromStr?: string, toStr?: string, subCategoryIds?: string): Promise<{
        publishedAt: Date;
        school: {
            id: string;
            name: string;
            image: string | null;
        };
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
        };
        content: string;
        title: string;
        id: string;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[] | {
        publishedAt: string;
        school: {
            id: string;
            name: string;
            image: string | null;
        };
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
        };
        content: string;
        title: string;
        id: string;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    blogsPublishedLegacy(schoolId?: string, q?: string, fromStr?: string, toStr?: string, subCategoryIds?: string): Promise<{
        publishedAt: Date;
        school: {
            id: string;
            name: string;
            image: string | null;
        };
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
        };
        content: string;
        title: string;
        id: string;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[] | {
        publishedAt: string;
        school: {
            id: string;
            name: string;
            image: string | null;
        };
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
        };
        content: string;
        title: string;
        id: string;
        coverImageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    blogById(id: string): Promise<{
        school: {
            id: string;
            name: string;
            image: string | null;
        };
        subCategory: {
            id: string;
            name: string;
        };
        subCategoryAdmin: {
            id: string;
            name: string;
        };
    } & {
        content: string;
        title: string;
        schoolId: string;
        subCategoryId: string;
        id: string;
        subCategoryAdminId: string;
        categoryId: string;
        coverImageUrl: string | null;
        imageUrls: string | null;
        heroTitle: string | null;
        heroParagraph: string | null;
        heroButtonText: string | null;
        heroButtonLink: string | null;
        contentBlocks: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        published: boolean;
        publishedAt: Date | null;
        revertNotes: string | null;
        rejectNotes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
