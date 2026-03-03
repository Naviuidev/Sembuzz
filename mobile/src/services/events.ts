import { api, getApiBaseUrl } from '../config/api';

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

export function imageSrc(url: string | null | undefined): string {
  if (!url) return '';
  const base = getApiBaseUrl();
  if (url.startsWith('http')) return url;
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}
