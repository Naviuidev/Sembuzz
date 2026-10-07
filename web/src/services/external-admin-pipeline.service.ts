import { api } from '../config/api';

export type PipelineSchool = {
  id: string;
  name: string;
  city: string;
  refNum: string;
  domain: string | null;
};

export type PipelineThreadMessage = {
  id: string;
  senderRole: 'external_admin' | 'school_admin' | 'system';
  body: string;
  createdAt: string;
};

export type PipelineRequestRow = {
  id: string;
  status: string;
  requestMessage: string | null;
  schoolAdminMessage: string | null;
  createdAt: string;
  updatedAt: string;
  school: PipelineSchool;
  externalCategory: { id: string; name: string };
  externalAdmin: { id: string; name: string; email: string; refNum: string };
  threadMessages?: PipelineThreadMessage[];
};

export const externalAdminPipelineService = {
  listSchools: async (): Promise<PipelineSchool[]> => {
    const res = await api.get<PipelineSchool[]>('/external-admin/pipeline/schools');
    return res.data;
  },

  listCategories: async (): Promise<Array<{ id: string; name: string }>> => {
    const res = await api.get('/external-admin/pipeline/categories');
    return res.data;
  },

  listRequests: async (): Promise<PipelineRequestRow[]> => {
    const res = await api.get<PipelineRequestRow[]>('/external-admin/pipeline/requests');
    return res.data;
  },

  summary: async (): Promise<{ pending: number; schoolReplies: number }> => {
    const res = await api.get('/external-admin/pipeline/requests/summary');
    return res.data;
  },

  createRequests: async (payload: {
    externalCategoryId: string;
    schoolIds: string[];
    message?: string;
  }) => {
    const res = await api.post('/external-admin/pipeline/requests', payload);
    return res.data;
  },

  getRequest: async (id: string): Promise<PipelineRequestRow> => {
    const res = await api.get<PipelineRequestRow>(`/external-admin/pipeline/requests/${id}`);
    return res.data;
  },

  reply: async (id: string, message: string) => {
    const res = await api.post(`/external-admin/pipeline/requests/${id}/reply`, { message });
    return res.data;
  },
};
