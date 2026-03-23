import { api, getApiBaseUrl } from '../config/api';
import { imageSrc } from '../utils/image';
export { imageSrc };

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

export interface EngagementCounts {
  likes: Record<string, number>;
  commentCounts: Record<string, number>;
  savedCounts: Record<string, number>;
}

export interface BannerAdPublic {
  id: string;
  imageUrl: string;
  externalLink?: string | null;
  startAt: string;
  endAt: string;
  schoolId: string;
  /** Home feed ordering with news (posting sequence). */
  createdAt?: string;
}

export interface SponsoredAdPublic {
  id: string;
  title: string | null;
  description: string | null;
  imageUrls: string | null;
  externalLink: string | null;
  startAt: string;
  endAt: string;
  schoolId: string;
  /** Home feed ordering with news (posting sequence). */
  createdAt?: string;
  school?: { id: string; name: string; image: string | null };
}

export async function getActiveBannerAds(schoolId?: string | null): Promise<BannerAdPublic[]> {
  const params: Record<string, string> = {};
  if (schoolId != null && String(schoolId).trim()) params.schoolId = String(schoolId).trim();
  const response = await api.get<BannerAdPublic[]>('/events/banner-ads', { params });
  return Array.isArray(response.data) ? response.data : [];
}

export async function recordBannerAdView(bannerAdId: string): Promise<{ ok: boolean }> {
  const response = await api.post<{ ok: boolean }>(`/events/banner-ads/${bannerAdId}/view`);
  return response.data;
}

export async function recordBannerAdClick(
  bannerAdId: string,
): Promise<{ ok: boolean; redirectUrl?: string | null }> {
  const response = await api.post<{ ok: boolean; redirectUrl?: string | null }>(
    `/events/banner-ads/${bannerAdId}/click`,
  );
  return response.data;
}

export async function getActiveSponsoredAds(schoolId?: string | null): Promise<SponsoredAdPublic[]> {
  const params: Record<string, string> = {};
  if (schoolId != null && String(schoolId).trim()) params.schoolId = String(schoolId).trim();
  const response = await api.get<SponsoredAdPublic[]>('/events/sponsored-ads', { params });
  return Array.isArray(response.data) ? response.data : [];
}

export async function recordSponsoredAdView(sponsoredAdId: string): Promise<{ ok: boolean }> {
  const response = await api.post<{ ok: boolean }>(`/events/sponsored-ads/${sponsoredAdId}/view`);
  return response.data;
}

export async function recordSponsoredAdClick(
  sponsoredAdId: string,
): Promise<{ ok: boolean; redirectUrl?: string | null }> {
  const response = await api.post<{ ok: boolean; redirectUrl?: string | null }>(
    `/events/sponsored-ads/${sponsoredAdId}/click`,
  );
  return response.data;
}

export async function getApprovedEvents(
  schoolId?: string | null,
  subCategoryIds?: string[],
): Promise<ApprovedEventPublic[]> {
  const params: Record<string, string> = {};
  if (schoolId != null && String(schoolId).trim()) params.schoolId = String(schoolId).trim();
  if (subCategoryIds?.length) params.subCategoryIds = subCategoryIds.join(',');
  const response = await api.get<ApprovedEventPublic[] | { data?: ApprovedEventPublic[] }>('/events/approved', {
    params,
  });
  const raw = response?.data;
  if (Array.isArray(raw)) return raw;
  if (raw != null && typeof raw === 'object') {
    const wrapped = (raw as { data?: unknown }).data;
    if (Array.isArray(wrapped)) return wrapped;
  }
  return [];
}

export async function getCategoriesBySchool(schoolId: string): Promise<CategoryPublic[]> {
  const sid = String(schoolId ?? '').trim();
  if (!sid) return [];
  const response = await api.get<CategoryPublic[]>('/events/categories', { params: { schoolId: sid } });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getUpcomingByDate(date: string): Promise<UpcomingPostPublic[]> {
  const response = await api.get<UpcomingPostPublic[]>('/events/upcoming', { params: { date } });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getUpcomingByRange(from: string, to: string): Promise<UpcomingPostPublic[]> {
  const response = await api.get<UpcomingPostPublic[]>('/events/upcoming', { params: { from, to } });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getEngagementCounts(
  eventIds: string[],
  options?: { dateFrom?: string; dateTo?: string },
): Promise<EngagementCounts> {
  if (eventIds.length === 0) return { likes: {}, commentCounts: {}, savedCounts: {} };
  const params: Record<string, string> = { eventIds: eventIds.join(',') };
  if (options?.dateFrom) params.dateFrom = options.dateFrom;
  if (options?.dateTo) params.dateTo = options.dateTo;
  const response = await api.get<EngagementCounts>('/events/engagement-counts', { params });
  const data = response?.data;
  return {
    likes: data?.likes ?? {},
    commentCounts: data?.commentCounts ?? {},
    savedCounts: data?.savedCounts ?? {},
  };
}

/** Build backend URL for "Login with Google" to add event to user's calendar (OAuth flow). */
export function buildGoogleCalendarAddAuthUrl(
  post: { title: string; description?: string | null; scheduledTo: string },
  returnUrl: string,
): string {
  const dateStr = post.scheduledTo.trim().slice(0, 10);
  const startISO = `${dateStr}T09:00:00.000Z`;
  const endISO = `${dateStr}T10:00:00.000Z`;
  const base = getApiBaseUrl().replace(/\/$/, '');
  const params = new URLSearchParams({
    returnUrl,
    title: post.title,
    start: startISO,
    end: endISO,
    ...(post.description ? { description: post.description } : {}),
  });
  return `${base}/google/calendar/add-auth?${params.toString()}`;
}
