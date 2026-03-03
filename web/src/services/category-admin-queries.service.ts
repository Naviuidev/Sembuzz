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

export interface SubCategoryAdminQueryItem {
  id: string;
  type: string;
  description?: string | null;
  attachmentUrl?: string | null;
  meetingType?: string | null;
  timeZone?: string | null;
  timeSlot?: string | null;
  status: string;
  createdAt: string;
  subCategoryAdmin: {
    name: string;
    email: string;
    category: { name: string };
    subCategory: { name: string };
  };
}

export interface SchoolAdminQueryItem {
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

export interface RaisedToSuperAdminQueryItem {
  id: string;
  type: string;
  description?: string | null;
  customMessage?: string | null;
  attachmentUrl?: string | null;
  meetingType?: string | null;
  meetingDate?: string | null;
  timeSlot?: string | null;
  timeZone?: string | null;
  status: string;
  createdAt: string;
}

export const categoryAdminQueriesService = {
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
    const response = await api.post('/category-admin/queries', payload);
    return response.data;
  },
  sendToSubCategoryAdmin: async (data: RaiseRequestDto): Promise<{ message?: string }> => {
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
    const response = await api.post('/category-admin/queries/to-subcategory-admin', payload);
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
    const response = await api.post('/category-admin/queries/to-super-admin', payload);
    return response.data;
  },
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/category-admin/queries/upload', formData);
    return response.data;
  },
  listFromSubcategoryAdmins: async (token?: string | null): Promise<SubCategoryAdminQueryItem[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<SubCategoryAdminQueryItem[]>('/category-admin/queries/from-subcategory-admins', { headers });
    return response.data;
  },
  replyToSubcategoryAdmin: async (queryId: string, message: string, token?: string | null): Promise<{ message: string }> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post(`/category-admin/queries/from-subcategory-admins/${queryId}/reply`, { message }, { headers });
    return response.data;
  },
  replyToSchoolAdmin: async (queryId: string, message: string, token?: string | null): Promise<{ message: string }> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post(`/category-admin/queries/from-school-admins/${queryId}/reply`, { message }, { headers });
    return response.data;
  },
  listFromSchoolAdmins: async (token?: string | null): Promise<SchoolAdminQueryItem[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<SchoolAdminQueryItem[]>('/category-admin/queries/from-school-admins', { headers });
    return response.data;
  },
  listRaisedToSuperAdmin: async (token?: string | null): Promise<RaisedToSuperAdminQueryItem[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<RaisedToSuperAdminQueryItem[]>('/category-admin/queries/raised-to-super-admin', { headers });
    return response.data;
  },
  replyToRaisedToSuperAdmin: async (queryId: string, message: string, token?: string | null): Promise<{ message: string }> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post<{ message: string }>(`/category-admin/queries/raised-to-super-admin/${queryId}/reply`, { message }, { headers });
    return response.data;
  },
  deleteFromSchoolAdmin: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/category-admin/queries/from-school-admins/${id}`);
    return response.data;
  },
  deleteFromSubcategoryAdmin: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/category-admin/queries/from-subcategory-admins/${id}`);
    return response.data;
  },
  deleteRaisedToSuperAdmin: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/category-admin/queries/raised-to-super-admin/${id}`);
    return response.data;
  },
};
