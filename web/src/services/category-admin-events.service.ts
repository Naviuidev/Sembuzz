import { api } from '../config/api';

export interface PendingEventForCategoryAdmin {
  id: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  commentsEnabled: boolean;
  imageUrls: string | null;
  status: string;
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
  subCategory: { id: string; name: string };
  subCategoryAdmin: { id: string; name: string; email: string };
}

export type ApprovedEventForCategoryAdmin = PendingEventForCategoryAdmin;

export interface UpdateEventDto {
  title?: string;
  description?: string;
  externalLink?: string;
  commentsEnabled?: boolean;
}

export const categoryAdminEventsService = {
  getPending: async (): Promise<PendingEventForCategoryAdmin[]> => {
    const response = await api.get<PendingEventForCategoryAdmin[]>(
      '/category-admin/events/pending',
    );
    return response.data;
  },

  update: async (
    eventId: string,
    dto: UpdateEventDto,
  ): Promise<PendingEventForCategoryAdmin> => {
    const response = await api.put<PendingEventForCategoryAdmin>(
      `/category-admin/events/${eventId}`,
      dto,
    );
    return response.data;
  },

  revert: async (
    eventId: string,
    revertNotes: string,
  ): Promise<unknown> => {
    const response = await api.post(
      `/category-admin/events/${eventId}/revert`,
      { revertNotes },
    );
    return response.data;
  },

  approve: async (eventId: string): Promise<unknown> => {
    const response = await api.post(
      `/category-admin/events/${eventId}/approve`,
    );
    return response.data;
  },

  getApproved: async (): Promise<ApprovedEventForCategoryAdmin[]> => {
    const response = await api.get<ApprovedEventForCategoryAdmin[]>(
      '/category-admin/events/approved',
    );
    return response.data;
  },

  deleteApproved: async (eventId: string): Promise<unknown> => {
    const response = await api.delete(`/category-admin/events/${eventId}`);
    return response.data;
  },
};
