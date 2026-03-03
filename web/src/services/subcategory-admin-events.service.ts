import { api } from '../config/api';

export interface AnalyzeBannerResponse {
  title: string;
  description: string;
  externalLink: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  externalLink?: string;
  commentsEnabled?: boolean;
  subCategoryId: string;
  imageUrls?: string[];
}

export interface PendingEvent {
  id: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  commentsEnabled: boolean;
  imageUrls: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  subCategory: { id: string; name: string };
}

export interface RevertedEvent extends PendingEvent {
  revertNotes: string | null;
}

export interface ApprovedEvent extends PendingEvent {}

export const subcategoryAdminEventsService = {
  analyzeBanner: async (file: File): Promise<AnalyzeBannerResponse> => {
    const formData = new FormData();
    formData.append('banner', file);
    const response = await api.post<AnalyzeBannerResponse>(
      '/subcategory-admin/events/analyze-banner',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  uploadEventImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>(
      '/subcategory-admin/events/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  create: async (dto: CreateEventDto) => {
    const response = await api.post('/subcategory-admin/events', dto);
    return response.data;
  },

  getPending: async (): Promise<PendingEvent[]> => {
    const response = await api.get<PendingEvent[]>('/subcategory-admin/events/pending');
    return response.data;
  },

  getReverted: async (): Promise<RevertedEvent[]> => {
    const response = await api.get<RevertedEvent[]>('/subcategory-admin/events/reverted');
    return response.data;
  },

  getApproved: async (): Promise<ApprovedEvent[]> => {
    const response = await api.get<ApprovedEvent[]>('/subcategory-admin/events/approved');
    return response.data;
  },
};
