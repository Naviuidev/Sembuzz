import { api } from '../config/api';

export const QueryType = {
  CUSTOM_MESSAGE: 'custom_message',
  SCHEDULE_MEETING: 'schedule_meeting',
} as const;

export const MeetingType = {
  GOOGLE_MEET: 'google_meet',
  ZOOM: 'zoom',
} as const;

export const TimeZone = { US: 'US', INDIA: 'India' } as const;

export interface RaiseRequestDto {
  type: 'custom_message' | 'schedule_meeting';
  customMessage?: string;
  description?: string;
  meetingType?: string;
  meetingDate?: string;
  timeZone?: string;
  timeSlot?: string;
  attachmentUrl?: string;
}

export interface FromSchoolAdminQueryItem {
  id: string;
  type: string;
  description?: string | null;
  attachmentUrl?: string | null;
  meetingType?: string | null;
  date?: string | null;
  timeSlot?: string | null;
  timeZone?: string | null;
  status: string;
  createdAt: string;
  schoolAdmin: {
    name: string;
    email: string;
    school: { name: string };
  };
}

export interface FromCategoryAdminQueryItem {
  id: string;
  type: string;
  description?: string | null;
  attachmentUrl?: string | null;
  meetingType?: string | null;
  meetingDate?: string | null;
  timeSlot?: string | null;
  timeZone?: string | null;
  status: string;
  createdAt: string;
  categoryAdmin: {
    name: string;
    email: string;
    category: { name: string };
  };
}

export const subcategoryAdminQueriesService = {
  sendRequest: async (data: RaiseRequestDto): Promise<{ message?: string }> => {
    const payload: Record<string, string | undefined> = {
      type: data.type,
      customMessage: data.type === 'custom_message' ? data.customMessage : undefined,
      description: data.type === 'custom_message' ? data.customMessage : data.description,
      meetingType: data.meetingType,
      meetingDate: data.meetingDate,
      timeZone: data.timeZone,
      timeSlot: data.timeSlot,
      attachmentUrl: data.attachmentUrl,
    };
    const response = await api.post('/subcategory-admin/queries', payload);
    return response.data;
  },
  sendToSchoolAdmin: async (data: RaiseRequestDto): Promise<{ message?: string }> => {
    const payload: Record<string, string | undefined> = {
      type: data.type,
      customMessage: data.type === 'custom_message' ? data.customMessage : undefined,
      description: data.type === 'custom_message' ? data.customMessage : data.description,
      meetingType: data.meetingType,
      meetingDate: data.meetingDate,
      timeZone: data.timeZone,
      timeSlot: data.timeSlot,
      attachmentUrl: data.attachmentUrl,
    };
    const response = await api.post('/subcategory-admin/queries/to-school-admin', payload);
    return response.data;
  },
  sendToSuperAdmin: async (data: RaiseRequestDto): Promise<{ message?: string }> => {
    const payload: Record<string, string | undefined> = {
      type: data.type,
      customMessage: data.type === 'custom_message' ? data.customMessage : undefined,
      description: data.type === 'custom_message' ? data.customMessage : data.description,
      meetingType: data.meetingType,
      meetingDate: data.meetingDate,
      timeZone: data.timeZone,
      timeSlot: data.timeSlot,
      attachmentUrl: data.attachmentUrl,
    };
    const response = await api.post('/subcategory-admin/queries/to-super-admin', payload);
    return response.data;
  },
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/subcategory-admin/queries/upload', formData);
    return response.data;
  },
  listFromSchoolAdmins: async (token?: string | null): Promise<FromSchoolAdminQueryItem[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<FromSchoolAdminQueryItem[]>('/subcategory-admin/queries/from-school-admins', { headers });
    return response.data;
  },
  listFromCategoryAdmins: async (token?: string | null): Promise<FromCategoryAdminQueryItem[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<FromCategoryAdminQueryItem[]>('/subcategory-admin/queries/from-category-admins', { headers });
    return response.data;
  },
  replyToSchoolAdmin: async (queryId: string, message: string, token?: string | null): Promise<{ message: string }> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post<{ message: string }>(`/subcategory-admin/queries/from-school-admins/${queryId}/reply`, { message }, { headers });
    return response.data;
  },
  replyToCategoryAdmin: async (queryId: string, message: string, token?: string | null): Promise<{ message: string }> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post<{ message: string }>(`/subcategory-admin/queries/from-category-admins/${queryId}/reply`, { message }, { headers });
    return response.data;
  },
  deleteFromSchoolAdmin: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/subcategory-admin/queries/from-school-admins/${id}`);
    return response.data;
  },
  deleteFromCategoryAdmin: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/subcategory-admin/queries/from-category-admins/${id}`);
    return response.data;
  },
};
