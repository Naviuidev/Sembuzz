import { api } from '../config/api';

export interface Feature {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface School {
  id: string;
  refNum: string;
  name: string;
  country?: string;
  state?: string;
  city: string;
  tenure?: number;
  isActive: boolean;
  enabledFeatures: Array<{ code: string; name: string }>;
  admin: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    password?: string; // Temporary password (only available immediately after creation)
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSchoolDto {
  schoolName: string;
  country: string;
  state?: string;
  city: string;
  domain: string;
  image?: string;
  selectedFeatures: string[];
  adminEmail: string;
  /** Required when "Ads" feature is selected. Email for the Ads Admin. */
  adsAdminEmail?: string;
  tenure?: number;
}

export interface UpdateSchoolDto {
  schoolName?: string;
  country?: string;
  state?: string;
  city?: string;
  tenure?: number;
  selectedFeatures?: string[];
  adminEmail?: string;
  isActive?: boolean;
  resetAdminPassword?: boolean;
}

export const schoolsService = {
  getAll: async (): Promise<School[]> => {
    const response = await api.get<School[]>('/super-admin/schools');
    return response.data;
  },

  getById: async (id: string): Promise<School> => {
    const response = await api.get<School>(`/super-admin/schools/${id}`);
    return response.data;
  },

  create: async (data: CreateSchoolDto): Promise<School> => {
    const response = await api.post<School>('/super-admin/schools', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSchoolDto): Promise<School> => {
    const response = await api.put<School>(`/super-admin/schools/${id}`, data);
    return response.data;
  },

  getFeatures: async (): Promise<Feature[]> => {
    const response = await api.get<Feature[]>('/super-admin/features');
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/super-admin/schools/${id}`);
    return response.data;
  },

  sendEmail: async (id: string, emailType: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/super-admin/schools/${id}/send-email`, {
      emailType,
    });
    return response.data;
  },
};
