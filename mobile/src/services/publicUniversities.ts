import { api } from '../config/api';

export interface PublicUniversityIngestionWindowUtc {
  timeZone?: string;
  firstDayInclusive: string;
  lastDayInclusive: string;
  horizonDays: number;
  currentMonthEndInclusive: string;
  computedAt: string;
}

export interface PublicUniversity {
  id: string;
  universityName: string;
  url: string;
  logoUrl: string;
  totalEvents: number;
  lastSyncedAt: string | null;
  ingestionWindowUtc?: PublicUniversityIngestionWindowUtc;
  feedKind?: 'legacy' | 'scraped';
}

export interface PublicUniversityEvent {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  startDate: string | null;
  endDate: string | null;
  rawDateText: string | null;
  rawTimeText: string | null;
  venue: string | null;
  organizer: string | null;
  category: string | null;
  tags: string[];
  registrationLink: string | null;
  imageUrl: string | null;
  detailUrl: string | null;
  contactInfo: string | null;
  firstSeenAt: string;
  multiMonthSpan?: boolean;
  occurrenceDates?: string[];
  occurrenceDisplayYmd?: string | null;
  multipleOccurrencesInMonth?: boolean;
  source: { id: string; universityName: string; url: string };
}

export interface ListPublicEventsResult {
  total: number;
  page: number;
  pageSize: number;
  items: PublicUniversityEvent[];
  categories: Array<{ name: string; count: number }>;
}

export interface ListPublicEventsQuery {
  search?: string;
  category?: string;
  dateUtc?: string;
  upcoming?: boolean;
  latest?: boolean;
  trending?: boolean;
  sort?: 'startDate' | 'firstSeenAt' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export async function listPublicUniversities(): Promise<PublicUniversity[]> {
  const response = await api.get<PublicUniversity[]>('/public/universities');
  return Array.isArray(response.data) ? response.data : [];
}

export async function getPublicUniversity(id: string): Promise<PublicUniversity> {
  const response = await api.get<PublicUniversity>(`/public/universities/${id}`);
  return response.data;
}

export async function listPublicUniversityEvents(
  id: string,
  query: ListPublicEventsQuery = {},
): Promise<ListPublicEventsResult> {
  const params: Record<string, string | number> = {};
  if (query.search) params.search = query.search;
  if (query.category) params.category = query.category;
  if (query.upcoming) params.upcoming = '1';
  if (query.latest) params.latest = '1';
  if (query.trending) params.trending = '1';
  if (query.dateUtc) params.dateUtc = query.dateUtc;
  if (query.sort) params.sort = query.sort;
  if (query.order) params.order = query.order;
  if (query.page) params.page = query.page;
  if (query.pageSize) params.pageSize = query.pageSize;

  const response = await api.get<ListPublicEventsResult>(`/public/universities/${id}/events`, {
    params,
  });
  return response.data;
}

export async function listAllAggregatedUniversityEvents(
  query: ListPublicEventsQuery = {},
): Promise<ListPublicEventsResult> {
  const params: Record<string, string | number> = {};
  if (query.search) params.search = query.search;
  if (query.category) params.category = query.category;
  if (query.upcoming) params.upcoming = '1';
  if (query.latest) params.latest = '1';
  if (query.trending) params.trending = '1';
  if (query.dateUtc) params.dateUtc = query.dateUtc;
  if (query.sort) params.sort = query.sort;
  if (query.order) params.order = query.order;
  if (query.page) params.page = query.page;
  if (query.pageSize) params.pageSize = query.pageSize;

  const response = await api.get<ListPublicEventsResult>('/public/university-events', { params });
  return response.data;
}

export function getUniversityCardTitle(uni: PublicUniversity): string {
  const raw = (uni.universityName || '').trim();
  const url = (uni.url || '').trim();
  const sameUrl =
    raw.length > 0 &&
    url.length > 0 &&
    raw.replace(/\/+$/, '').toLowerCase() === url.replace(/\/+$/, '').toLowerCase();
  const nameIsJustUrl = /^https?:\/\//i.test(raw) || sameUrl;

  if (raw && !nameIsJustUrl) return raw;

  const parseHost = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  if (raw && /^https?:\/\//i.test(raw)) {
    const h = parseHost(raw);
    if (h) return h;
  }

  const h = parseHost(url);
  return h || raw || url || 'University';
}

export function formatUniversityEventDate(iso: string | null, fallback?: string | null): string {
  if (!iso) return fallback?.trim() || '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback?.trim() || '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
