import { api } from '../config/api';
import type { ExternalPostRequestRow } from './external-admin-post-requests.service';

export type { ExternalPostRequestRow };

export const schoolAdminExternalPostRequestsService = {
  listRequests: async (): Promise<ExternalPostRequestRow[]> => {
    const res = await api.get<ExternalPostRequestRow[]>('/school-admin/external-post-requests/requests');
    return res.data;
  },

  pendingCount: async (): Promise<{ pending: number }> => {
    const res = await api.get<{ pending: number }>(
      '/school-admin/external-post-requests/requests/pending-count',
    );
    return res.data;
  },

  getRequest: async (id: string): Promise<ExternalPostRequestRow> => {
    const res = await api.get<ExternalPostRequestRow>(`/school-admin/external-post-requests/requests/${id}`);
    return res.data;
  },

  sendQuery: async (id: string, message: string) => {
    const res = await api.post(`/school-admin/external-post-requests/requests/${id}/send-query`, { message });
    return res.data;
  },

  reply: async (id: string, message: string) => {
    const res = await api.post(`/school-admin/external-post-requests/requests/${id}/reply`, { message });
    return res.data;
  },

  approve: async (id: string, message?: string) => {
    const res = await api.post(`/school-admin/external-post-requests/requests/${id}/approve`, { message });
    return res.data;
  },

  reject: async (id: string, message?: string) => {
    const res = await api.post(`/school-admin/external-post-requests/requests/${id}/reject`, { message });
    return res.data;
  },

  ban: async (id: string, message?: string) => {
    const res = await api.post(`/school-admin/external-post-requests/requests/${id}/ban`, { message });
    return res.data;
  },
};
