import { api } from '../config/api';

export const SupportRequestType = {
  RAISE_ISSUE: 'raise_issue',
  INTEGRATE_FEATURE: 'integrate_feature',
  UI_CHANGE: 'ui_change',
  UPSCALE_PLATFORM: 'upscale_platform',
  CUSTOM_MESSAGE: 'custom_message',
  SCHEDULE_MEETING: 'schedule_meeting',
} as const;

export type SupportRequestType = typeof SupportRequestType[keyof typeof SupportRequestType];

export const MeetingType = {
  GOOGLE_MEET: 'google_meet',
  ZOOM: 'zoom',
} as const;

export type MeetingType = typeof MeetingType[keyof typeof MeetingType];

export const TimeZone = {
  US: 'US',
  INDIA: 'India',
} as const;

export type TimeZone = typeof TimeZone[keyof typeof TimeZone];

export interface SupportRequestDto {
  type: SupportRequestType;
  description?: string;
  meetingType?: MeetingType;
  meetingDate?: string;
  timeZone?: TimeZone;
  timeSlot?: string;
  customMessage?: string;
}

export interface SuperAdminQuery {
  id: string;
  type: string;
  meetingType?: string;
  meetingDate?: string;
  timeZone?: string;
  timeSlot?: string;
  description?: string;
  customMessage?: string;
  status: string;
  createdAt: string;
  superAdmin: {
    id: string;
    name: string;
    email: string;
  };
}

export const supportService = {
  sendRequest: async (data: SupportRequestDto): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/super-admin/support/request', data);
    return response.data;
  },
  getQueries: async (): Promise<SuperAdminQuery[]> => {
    const response = await api.get<SuperAdminQuery[]>('/super-admin/support/queries');
    return response.data;
  },
  getQueriesFromSchoolAdmins: async () => {
    const response = await api.get('/super-admin/support/queries/from-school-admins');
    return response.data;
  },
  getQueriesFromCategoryAdmins: async () => {
    const response = await api.get('/super-admin/support/queries/from-category-admins');
    return response.data;
  },
  getQueriesFromSubcategoryAdmins: async () => {
    const response = await api.get('/super-admin/support/queries/from-subcategory-admins');
    return response.data;
  },
  updateStatus: async (id: string, status: string): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/super-admin/support/queries/${id}/status`, { status });
    return response.data;
  },
  sendReply: async (id: string, message: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/super-admin/support/queries/${id}/reply`, { message });
    return response.data;
  },
  replyToSchoolAdmin: async (id: string, message: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/super-admin/support/queries/from-school-admins/${id}/reply`, { message });
    return response.data;
  },
  replyToCategoryAdmin: async (id: string, message: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/super-admin/support/queries/from-category-admins/${id}/reply`, { message });
    return response.data;
  },
  replyToSubcategoryAdmin: async (id: string, message: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/super-admin/support/queries/from-subcategory-admins/${id}/reply`, { message });
    return response.data;
  },
  deleteFromSchoolAdmins: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/super-admin/support/queries/from-school-admins/${id}`);
    return response.data;
  },
  deleteFromCategoryAdmins: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/super-admin/support/queries/from-category-admins/${id}`);
    return response.data;
  },
  deleteFromSubcategoryAdmins: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/super-admin/support/queries/from-subcategory-admins/${id}`);
    return response.data;
  },
  deleteSuperAdminQuery: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/super-admin/support/queries/super-admin/${id}`);
    return response.data;
  },
};
