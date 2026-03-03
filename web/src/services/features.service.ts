import { api } from '../config/api';
import type { Feature } from './schools.service';

export interface CreateFeatureDto {
  code: string;
  name: string;
}

export interface UpdateFeatureDto {
  name: string;
}

export const featuresService = {
  getAll: async (): Promise<Feature[]> => {
    const response = await api.get<Feature[]>('/super-admin/features');
    return response.data;
  },

  create: async (data: CreateFeatureDto): Promise<Feature> => {
    const response = await api.post<Feature>('/super-admin/features', data);
    return response.data;
  },

  update: async (id: string, data: UpdateFeatureDto): Promise<Feature> => {
    const response = await api.put<Feature>(`/super-admin/features/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/super-admin/features/${id}`);
    return response.data;
  },
};
