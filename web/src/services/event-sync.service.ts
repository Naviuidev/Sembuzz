import { api } from '../config/api';

export type ScrapedEventSource = {
  id: string;
  name: string;
  websiteUrl: string;
  scraperType: string;
  selectorsJson: unknown | null;
  active: boolean;
  lastSyncedAt: string | null;
  totalEvents?: number;
  createdAt: string;
  updatedAt: string;
};

/** Legacy CSV/GPT pipeline — same rows as “University feed” on /universities */
export type LegacyUniversitySource = {
  id: string;
  universityName: string;
  url: string;
  status: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  totalEvents: number;
  isActive: boolean;
  createdAt: string;
};

/** Unified row for Super Admin sources table */
export type EventFeedSourceRow = {
  id: string;
  name: string;
  url: string;
  feedKind: 'scraped' | 'legacy';
  active: boolean;
  totalEvents: number;
  lastSyncedAt: string | null;
  scraperType?: string;
  legacyStatus?: string;
};

export type ScrapedSyncLogDetails = {
  version?: number;
  purpose?: string;
  sourceUrlFetched?: string;
  sourceUrlSaved?: string;
  calendarUrlDiscovered?: string;
  sourceName?: string;
  run?: {
    durationMs?: number;
    htmlLengthChars?: number;
    fetchedWithPlaywright?: boolean;
    extractionMode?: string;
    timezoneUsedForMonthBuckets?: string;
  };
  ingestionMonthWindow?: {
    timeZone?: string;
    firstDayInclusive?: string;
    lastDayInclusive?: string;
    horizonDays?: number;
  };
  counts?: {
    parsedFromPage?: number;
    inCurrentMonthWindow?: number;
    skippedNoStartDate?: number;
    skippedOutsideMonthWindow?: number;
    upsertedToDatabase?: number;
    withStartDate?: number;
    withoutStartDate?: number;
  };
  startDateRangeUtc?: { min: string | null; max: string | null };
  monthsCoveredInSyncTimezone?: string[];
  sampleEvents?: Array<{
    title?: string;
    startDateUtc?: string | null;
    endDateUtc?: string | null;
    startMonthInTimezone?: string | null;
    venue?: string | null;
    sourceUrl?: string | null;
  }>;
  validationHints?: { note?: string };
  outcome?: { failed?: boolean; errorMessage?: string; hintMessage?: string };
};

export type ScrapedSyncLog = {
  id: string;
  sourceId: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  totalEvents: number;
  errors: string | null;
  detailsJson: ScrapedSyncLogDetails | null;
  source?: { id: string; name: string; websiteUrl: string };
};

export const eventSyncService = {
  listSources: async (): Promise<ScrapedEventSource[]> => {
    const { data } = await api.get<ScrapedEventSource[]>('/super-admin/event-sync/sources');
    return data;
  },

  createSource: async (body: {
    name: string;
    websiteUrl: string;
    scraperType?: string;
    selectorsJson?: Record<string, unknown>;
    active?: boolean;
  }): Promise<ScrapedEventSource> => {
    const { data } = await api.post<ScrapedEventSource>('/super-admin/event-sync/sources', body);
    return data;
  },

  deleteSource: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete<{ ok: boolean }>(`/super-admin/event-sync/sources/${id}`);
    return data;
  },

  triggerSync: async (
    sourceId: string,
  ): Promise<{ ok: boolean; logId: string; totalEvents?: number; errors?: string | null; details?: unknown }> => {
    const { data } = await api.post<{
      ok: boolean;
      logId: string;
      totalEvents?: number;
      errors?: string | null;
      details?: unknown;
    }>(`/super-admin/event-sync/sources/${sourceId}/sync`);
    return data;
  },

  listLogs: async (limit = 40): Promise<ScrapedSyncLog[]> => {
    const { data } = await api.get<ScrapedSyncLog[]>('/super-admin/event-sync/sync/logs', {
      params: { limit },
    });
    return data;
  },

  syncStatus: async (): Promise<{ ok: boolean; worker: string; message: string }> => {
    const { data } = await api.get('/super-admin/event-sync/sync/status');
    return data;
  },

  listLegacyUniversitySources: async (): Promise<LegacyUniversitySource[]> => {
    const { data } = await api.get<LegacyUniversitySource[]>('/super-admin/fetch-events/sources');
    return data;
  },

  deleteLegacyUniversitySource: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete<{ ok: boolean }>(`/super-admin/fetch-events/sources/${id}`);
    return data;
  },

  syncLegacyUniversitySource: async (id: string): Promise<{ ok: boolean; jobId?: string }> => {
    const { data } = await api.post<{ ok: boolean; jobId?: string }>(
      `/super-admin/fetch-events/sources/${id}/sync`,
    );
    return data;
  },
};
