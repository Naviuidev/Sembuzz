import { api } from '../config/api';

export const SchoolAdminQueryType = {
  CUSTOM_MESSAGE: 'custom_message',
  SCHEDULE_MEETING: 'schedule_meeting',
} as const;

export type SchoolAdminQueryType = (typeof SchoolAdminQueryType)[keyof typeof SchoolAdminQueryType];

export const MeetingType = {
  GOOGLE_MEET: 'google_meet',
  ZOOM: 'zoom',
} as const;

export type MeetingType = (typeof MeetingType)[keyof typeof MeetingType];

export const TimeZone = {
  US: 'US',
  INDIA: 'India',
} as const;

export type TimeZone = (typeof TimeZone)[keyof typeof TimeZone];

export interface SchoolAdminRaiseRequestDto {
  type: 'custom_message' | 'schedule_meeting';
  customMessage?: string;
  description?: string;
  meetingType?: string;
  meetingDate?: string;
  timeZone?: string;
  timeSlot?: string;
  attachmentUrl?: string;
}

export interface CategoryAdminQueryItem {
  id: string;
  type: string;
  description?: string | null;
  attachmentUrl?: string | null;
  meetingType?: string | null;
  timeZone?: string | null;
  timeSlot?: string | null;
  status: string;
  createdAt: string;
  categoryAdmin: {
    name: string;
    email: string;
    category: { name: string };
  };
}

/** Queries raised by school admin to super admin (GET /school-admin/queries) */
export interface RaisedToSuperAdminQueryItem {
  id: string;
  type: string;
  description?: string | null;
  attachmentUrl?: string | null;
  meetingType?: string | null;
  date?: string | null;
  timeSlot?: string | null;
  timeZone?: string | null;
  meetingLink?: string | null;
  status: string;
  createdAt: string;
  schoolAdmin?: {
    school: { name: string; refNum?: string };
  };
}

/** Queries from subcategory admins to this school (GET from-subcategory-admins) */
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

export const schoolAdminQueriesService = {
  sendRequest: async (data: SchoolAdminRaiseRequestDto): Promise<{ message?: string }> => {
    const payload: Record<string, string | undefined> = {
      type: data.type,
      customMessage: data.type === 'custom_message' ? data.customMessage : undefined,
      description: data.type === 'custom_message' ? data.customMessage : data.description,
      meetingType: data.meetingType,
      date: data.meetingDate,
      timeZone: data.timeZone,
      timeSlot: data.timeSlot,
      attachmentUrl: data.attachmentUrl,
    };
    const response = await api.post('/school-admin/queries', payload);
    return response.data;
  },

  sendToCategoryAdmin: async (data: SchoolAdminRaiseRequestDto): Promise<{ message?: string }> => {
    const payload: Record<string, string | undefined> = {
      type: data.type,
      customMessage: data.type === 'custom_message' ? data.customMessage : undefined,
      description: data.type === 'custom_message' ? data.customMessage : data.description,
      meetingType: data.meetingType,
      date: data.meetingDate,
      timeZone: data.timeZone,
      timeSlot: data.timeSlot,
      attachmentUrl: data.attachmentUrl,
    };
    const response = await api.post('/school-admin/queries/to-category-admin', payload);
    return response.data;
  },

  sendToSubCategoryAdmin: async (data: SchoolAdminRaiseRequestDto): Promise<{ message?: string }> => {
    const payload: Record<string, string | undefined> = {
      type: data.type,
      customMessage: data.type === 'custom_message' ? data.customMessage : undefined,
      description: data.type === 'custom_message' ? data.customMessage : data.description,
      meetingType: data.meetingType,
      date: data.meetingDate,
      timeZone: data.timeZone,
      timeSlot: data.timeSlot,
      attachmentUrl: data.attachmentUrl,
    };
    const response = await api.post('/school-admin/queries/to-subcategory-admin', payload);
    return response.data;
  },

  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/school-admin/queries/upload', formData);
    return response.data;
  },
  listRaisedToSuperAdmin: async (token?: string | null): Promise<RaisedToSuperAdminQueryItem[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<RaisedToSuperAdminQueryItem[]>('/school-admin/queries', { headers });
    return response.data;
  },
  listFromCategoryAdmins: async (token?: string | null): Promise<CategoryAdminQueryItem[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<CategoryAdminQueryItem[]>('/school-admin/queries/from-category-admins', { headers });
    return response.data;
  },
  listFromSubCategoryAdmins: async (token?: string | null): Promise<SubCategoryAdminQueryItem[]> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<SubCategoryAdminQueryItem[]>('/school-admin/queries/from-subcategory-admins', { headers });
    return response.data;
  },
  replyToCategoryAdmin: async (queryId: string, message: string, token?: string | null): Promise<{ message: string }> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post(`/school-admin/queries/from-category-admins/${queryId}/reply`, { message }, { headers });
    return response.data;
  },
  replyToSubcategoryAdmin: async (queryId: string, message: string, token?: string | null): Promise<{ message: string }> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.post(`/school-admin/queries/from-subcategory-admins/${queryId}/reply`, { message }, { headers });
    return response.data;
  },
  deleteRaised: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/school-admin/queries/raised/${id}`);
    return response.data;
  },
  deleteFromCategoryAdmin: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/school-admin/queries/from-category-admins/${id}`);
    return response.data;
  },
  deleteFromSubcategoryAdmin: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/school-admin/queries/from-subcategory-admins/${id}`);
    return response.data;
  },
};
