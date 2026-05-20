import { api } from '../config/api';

/** Matches backend sync: **current calendar month** in `timeZone` (first/last local day + `horizonDays` = days in that month). */
export interface PublicUniversityIngestionWindowUtc {
  /** IANA zone (e.g. America/New_York). Dates below are YYYY-MM-DD in this zone. */
  timeZone?: string;
  firstDayInclusive: string;
  lastDayInclusive: string;
  /** Number of days in the sync calendar month (28–31). */
  horizonDays: number;
  /** Last calendar day of the month containing “today” in `timeZone`. */
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
  /** `legacy` = CSV/GPT university pipeline; `scraped` = Super Admin → Fetch events (URL scrape). */
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
  /** Calendar day YYYY-MM-DD in the university ingestion time zone (see `ingestionWindowUtc.timeZone`). */
  dateUtc?: string;
  upcoming?: boolean;
  latest?: boolean;
  trending?: boolean;
  sort?: 'startDate' | 'firstSeenAt' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const publicUniversitiesService = {
  listAll: async (): Promise<PublicUniversity[]> => {
    const response = await api.get<PublicUniversity[]>('/public/universities');
    return response.data;
  },

  getOne: async (id: string): Promise<PublicUniversity> => {
    const response = await api.get<PublicUniversity>(`/public/universities/${id}`);
    return response.data;
  },

  listEvents: async (id: string, query: ListPublicEventsQuery = {}): Promise<ListPublicEventsResult> => {
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
    const response = await api.get<ListPublicEventsResult>(`/public/universities/${id}/events`, { params });
    return response.data;
  },

  listAllAggregated: async (query: ListPublicEventsQuery = {}): Promise<ListPublicEventsResult> => {
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
  },
};
