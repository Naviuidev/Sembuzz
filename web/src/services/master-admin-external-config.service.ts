import { api } from '../config/api';
import type { PipelineRequestRow } from './external-admin-pipeline.service';
import type { ExternalPostRequestRow } from './external-admin-post-requests.service';

const params = (schoolId: string) => ({ params: { schoolId } });

export type MasterAdminExternalSchoolOption = { id: string; name: string };
export type ExternalContentKind = 'job' | 'offer' | 'campaign';

export const masterAdminExternalConfigService = {
  listSchoolsWithExternalActivity: async (): Promise<MasterAdminExternalSchoolOption[]> => {
    const res = await api.get<MasterAdminExternalSchoolOption[]>('/master-admin/external-config/schools');
    return res.data;
  },

  listPipelineRequests: async (schoolId: string): Promise<PipelineRequestRow[]> => {
    const res = await api.get<PipelineRequestRow[]>('/master-admin/external-config/pipeline/requests', params(schoolId));
    return res.data;
  },

  pipelinePendingCount: async (schoolId: string): Promise<{ pending: number }> => {
    const res = await api.get<{ pending: number }>(
      '/master-admin/external-config/pipeline/requests/pending-count',
      params(schoolId),
    );
    return res.data;
  },

  getPipelineRequest: async (schoolId: string, id: string): Promise<PipelineRequestRow> => {
    const res = await api.get<PipelineRequestRow>(
      `/master-admin/external-config/pipeline/requests/${id}`,
      params(schoolId),
    );
    return res.data;
  },

  pipelineSendQuery: async (schoolId: string, id: string, message: string) => {
    const res = await api.post(
      `/master-admin/external-config/pipeline/requests/${id}/send-query`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  pipelineReply: async (schoolId: string, id: string, message: string) => {
    const res = await api.post(
      `/master-admin/external-config/pipeline/requests/${id}/reply`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  pipelineApprove: async (schoolId: string, id: string, message?: string) => {
    const res = await api.post(
      `/master-admin/external-config/pipeline/requests/${id}/approve`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  pipelineReject: async (schoolId: string, id: string, message?: string) => {
    const res = await api.post(
      `/master-admin/external-config/pipeline/requests/${id}/reject`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  pipelineBan: async (schoolId: string, id: string, message?: string) => {
    const res = await api.post(
      `/master-admin/external-config/pipeline/requests/${id}/ban`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  listPostRequests: async (schoolId: string): Promise<ExternalPostRequestRow[]> => {
    const res = await api.get<ExternalPostRequestRow[]>(
      '/master-admin/external-config/post-requests/requests',
      params(schoolId),
    );
    return res.data;
  },

  postPendingCount: async (schoolId: string): Promise<{ pending: number }> => {
    const res = await api.get<{ pending: number }>(
      '/master-admin/external-config/post-requests/pending-count',
      params(schoolId),
    );
    return res.data;
  },

  getPostRequest: async (schoolId: string, id: string): Promise<ExternalPostRequestRow> => {
    const res = await api.get<ExternalPostRequestRow>(
      `/master-admin/external-config/post-requests/requests/${id}`,
      params(schoolId),
    );
    return res.data;
  },

  postSendQuery: async (schoolId: string, id: string, message: string) => {
    const res = await api.post(
      `/master-admin/external-config/post-requests/requests/${id}/send-query`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  postReply: async (schoolId: string, id: string, message: string) => {
    const res = await api.post(
      `/master-admin/external-config/post-requests/requests/${id}/reply`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  postApprove: async (schoolId: string, id: string, message?: string) => {
    const res = await api.post(
      `/master-admin/external-config/post-requests/requests/${id}/approve`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  postReject: async (schoolId: string, id: string, message?: string) => {
    const res = await api.post(
      `/master-admin/external-config/post-requests/requests/${id}/reject`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  postBan: async (schoolId: string, id: string, message?: string) => {
    const res = await api.post(
      `/master-admin/external-config/post-requests/requests/${id}/ban`,
      { message },
      params(schoolId),
    );
    return res.data;
  },

  getContentContext: async (
    schoolId: string,
    kind: ExternalContentKind,
  ): Promise<{
    canPost: boolean;
    externalCategoryId: string | null;
    categoryName: string | null;
    externalAdminId: string | null;
  }> => {
    const res = await api.get('/master-admin/external-config/content-context', {
      params: { schoolId, kind },
    });
    return res.data;
  },

  createJob: async (
    schoolId: string,
    externalCategoryId: string,
    payload: Parameters<typeof import('./external-admin-post-requests.service').externalAdminPostRequestsService.createJobRequest>[0],
  ) => {
    const res = await api.post('/master-admin/external-config/jobs', { ...payload, schoolId, externalCategoryId }, params(schoolId));
    return res.data;
  },

  createOffer: async (
    schoolId: string,
    externalCategoryId: string,
    payload: Parameters<typeof import('./external-admin-post-requests.service').externalAdminPostRequestsService.createOfferRequest>[0],
  ) => {
    const res = await api.post('/master-admin/external-config/offers', { ...payload, schoolId, externalCategoryId }, params(schoolId));
    return res.data;
  },

  createCampaign: async (
    schoolId: string,
    externalCategoryId: string,
    payload: Parameters<typeof import('./external-admin-post-requests.service').externalAdminPostRequestsService.createCampaignRequest>[0],
  ) => {
    const res = await api.post(
      '/master-admin/external-config/campaigns',
      { ...payload, schoolId, externalCategoryId },
      params(schoolId),
    );
    return res.data;
  },

  publishExternalPost: async (
    postId: string,
    dto: { schoolId: string; contentKind: ExternalContentKind; categoryId?: string; subCategoryId?: string },
  ) => {
    const res = await api.post(`/master-admin/external-config/post-requests/requests/${postId}/publish`, dto);
    return res.data;
  },

  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<{ url: string }>('/master-admin/external-config/upload-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};
