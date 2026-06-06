import { api } from '../config/api';

export type JsonUploadGroupRow = {
  id: string;
  universityName: string;
  calendarUrl: string;
  logoUrl: string | null;
  status: 'draft' | 'published' | string;
  publishedSourceId: string | null;
  publishedAt: string | null;
  createdAt: string;
  eventCount: number;
  fileName?: string;
  uploadedAt?: string;
  /** True when publishedSourceId points at an active scraped_event_sources row (visible on /universities). */
  publicLive?: boolean;
};

export type JsonUploadGroupDetail = JsonUploadGroupRow & {
  events: Array<{
    id: string;
    title: string;
    university: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    startTime: string | null;
    endTime: string | null;
    allDay: boolean;
    venue: string | null;
    detailUrl: string | null;
    posterUrl: string | null;
    logoUrl: string | null;
  }>;
};

export const jsonUploadService = {
  create: async (
    fileName: string,
    events: Record<string, unknown>[],
  ): Promise<{
    uploadId: string;
    fileName: string;
    groupCount: number;
    eventCount: number;
    groups: JsonUploadGroupRow[];
  }> => {
    const { data } = await api.post('/super-admin/json-upload', { fileName, events });
    return data;
  },

  listGroups: async (): Promise<JsonUploadGroupRow[]> => {
    const { data } = await api.get<JsonUploadGroupRow[]>('/super-admin/json-upload/groups');
    return data;
  },

  getGroup: async (id: string): Promise<JsonUploadGroupDetail> => {
    const { data } = await api.get<JsonUploadGroupDetail>(`/super-admin/json-upload/groups/${id}`);
    return data;
  },

  deleteGroup: async (id: string): Promise<{ ok: boolean }> => {
    const { data } = await api.delete<{ ok: boolean }>(`/super-admin/json-upload/groups/${id}`);
    return data;
  },

  publishGroup: async (
    id: string,
  ): Promise<{
    ok: boolean;
    publishedSourceId?: string;
    eventCount?: number;
    universityName?: string;
    alreadyPublished?: boolean;
  }> => {
    const { data } = await api.post(`/super-admin/json-upload/groups/${id}/publish`);
    return data;
  },
};
