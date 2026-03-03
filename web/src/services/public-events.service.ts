import { api } from '../config/api';

export interface ApprovedEventPublic {
  id: string;
  schoolId: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  commentsEnabled: boolean;
  imageUrls: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  school?: { name: string; image: string | null } | null;
  subCategory: { id: string; name: string };
}

export interface CategoryPublic {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

export interface UpcomingPostPublic {
  id: string;
  schoolId: string;
  title: string;
  description: string | null;
  imageUrls: string | null;
  scheduledTo: string;
  createdAt: string;
  school?: { id: string; name: string; image: string | null };
  category?: { id: string; name: string };
  subCategory?: { id: string; name: string };
}

export const publicEventsService = {
  getUpcomingByDate: async (date: string): Promise<UpcomingPostPublic[]> => {
    const response = await api.get<UpcomingPostPublic[]>('/events/upcoming', {
      params: { date },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  getCategoriesBySchool: async (schoolId: string): Promise<CategoryPublic[]> => {
    const sid = String(schoolId ?? '').trim();
    if (!sid) return [];
    const response = await api.get<CategoryPublic[]>('/events/categories', {
      params: { schoolId: sid },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Get approved events. If schoolId is provided, filter by that school; otherwise return all approved events from all schools. */
  getApproved: async (
    schoolId?: string | null,
    subCategoryIds?: string[],
  ): Promise<ApprovedEventPublic[]> => {
    const params: Record<string, string> = {};
    if (schoolId != null && String(schoolId).trim()) params.schoolId = String(schoolId).trim();
    if (subCategoryIds?.length) params.subCategoryIds = subCategoryIds.join(',');
    const response = await api.get<ApprovedEventPublic[] | { data?: ApprovedEventPublic[] }>('/events/approved', {
      params,
    });
    const raw = response?.data;
    // Backend returns a JSON array; normalize so we always get an array (handles [] from different realm, { data: [] }, or array-like)
    if (Array.isArray(raw)) return raw;
    if (raw != null && typeof raw === 'object') {
      const wrapped = (raw as { data?: unknown }).data;
      if (Array.isArray(wrapped)) return wrapped;
      try {
        const arr = Array.from(raw as unknown as ArrayLike<ApprovedEventPublic>);
        if (Array.isArray(arr)) return arr;
      } catch {
        // ignore
      }
    }
    return [];
  },

  /** Public like, comment, and saved counts for event IDs (no auth). Optional dateFrom/dateTo (YYYY-MM-DD) filter by when the engagement happened. */
  getEngagementCounts: async (
    eventIds: string[],
    options?: { dateFrom?: string; dateTo?: string },
  ): Promise<{
    likes: Record<string, number>;
    commentCounts: Record<string, number>;
    savedCounts: Record<string, number>;
  }> => {
    if (eventIds.length === 0) {
      return { likes: {}, commentCounts: {}, savedCounts: {} };
    }
    const params: Record<string, string> = { eventIds: eventIds.join(',') };
    if (options?.dateFrom) params.dateFrom = options.dateFrom;
    if (options?.dateTo) params.dateTo = options.dateTo;
    const response = await api.get<{
      likes: Record<string, number>;
      commentCounts: Record<string, number>;
      savedCounts: Record<string, number>;
    }>('/events/engagement-counts', { params });
    const data = response?.data;
    return {
      likes: data?.likes ?? {},
      commentCounts: data?.commentCounts ?? {},
      savedCounts: data?.savedCounts ?? {},
    };
  },

  /** Active banner ads (startAt <= now <= endAt). Optional schoolId to filter by school. For guests and logged-in users. */
  getActiveBannerAds: async (schoolId?: string | null): Promise<{ id: string; imageUrl: string; externalLink?: string | null; startAt: string; endAt: string; schoolId: string }[]> => {
    const params: Record<string, string> = {};
    if (schoolId != null && String(schoolId).trim()) params.schoolId = String(schoolId).trim();
    const response = await api.get<{ id: string; imageUrl: string; externalLink?: string | null; startAt: string; endAt: string; schoolId: string }[]>('/events/banner-ads', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  recordBannerAdView: async (bannerAdId: string): Promise<{ ok: boolean }> => {
    const response = await api.post<{ ok: boolean }>(`/events/banner-ads/${bannerAdId}/view`);
    return response.data;
  },

  recordBannerAdClick: async (bannerAdId: string): Promise<{ ok: boolean; redirectUrl?: string | null }> => {
    const response = await api.post<{ ok: boolean; redirectUrl?: string | null }>(`/events/banner-ads/${bannerAdId}/click`);
    return response.data;
  },

  /** Active sponsored ads (startAt <= now <= endAt). Optional schoolId. */
  getActiveSponsoredAds: async (schoolId?: string | null): Promise<SponsoredAdPublic[]> => {
    const params: Record<string, string> = {};
    if (schoolId != null && String(schoolId).trim()) params.schoolId = String(schoolId).trim();
    const response = await api.get<SponsoredAdPublic[]>('/events/sponsored-ads', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  recordSponsoredAdView: async (sponsoredAdId: string): Promise<{ ok: boolean }> => {
    const response = await api.post<{ ok: boolean }>(`/events/sponsored-ads/${sponsoredAdId}/view`);
    return response.data;
  },

  recordSponsoredAdClick: async (sponsoredAdId: string): Promise<{ ok: boolean; redirectUrl?: string | null }> => {
    const response = await api.post<{ ok: boolean; redirectUrl?: string | null }>(`/events/sponsored-ads/${sponsoredAdId}/click`);
    return response.data;
  },
};

export interface SponsoredAdPublic {
  id: string;
  title: string | null;
  description: string | null;
  imageUrls: string | null;
  externalLink: string | null;
  startAt: string;
  endAt: string;
  schoolId: string;
  school?: { id: string; name: string; image: string | null };
}
