import { api } from '../config/api';
import type { PipelineRequestRow } from './external-admin-pipeline.service';

export const schoolAdminExternalPipelineService = {
  listRequests: async (): Promise<PipelineRequestRow[]> => {
    const res = await api.get<PipelineRequestRow[]>('/school-admin/external-pipeline/requests');
    return res.data;
  },

  pendingCount: async (): Promise<{ pending: number }> => {
    const res = await api.get<{ pending: number }>('/school-admin/external-pipeline/requests/pending-count');
    return res.data;
  },

  sendQuery: async (id: string, message: string) => {
    const res = await api.post(`/school-admin/external-pipeline/requests/${id}/send-query`, { message });
    return res.data;
  },

  approve: async (id: string, message?: string) => {
    const res = await api.post(`/school-admin/external-pipeline/requests/${id}/approve`, { message });
    return res.data;
  },

  reject: async (id: string, message?: string) => {
    const res = await api.post(`/school-admin/external-pipeline/requests/${id}/reject`, { message });
    return res.data;
  },

  ban: async (id: string, message?: string) => {
    const res = await api.post(`/school-admin/external-pipeline/requests/${id}/ban`, { message });
    return res.data;
  },

  getRequest: async (id: string): Promise<PipelineRequestRow> => {
    const res = await api.get<PipelineRequestRow>(`/school-admin/external-pipeline/requests/${id}`);
    return res.data;
  },

  reply: async (id: string, message: string) => {
    const res = await api.post(`/school-admin/external-pipeline/requests/${id}/reply`, { message });
    return res.data;
  },
};
