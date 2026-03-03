import { api } from '../config/api';

export interface SchoolOption {
  id: string;
  name: string;
  domain: string | null;
  image: string | null;
}

export async function getSchools(): Promise<SchoolOption[]> {
  const response = await api.get<SchoolOption[]>('/user/auth/schools');
  return Array.isArray(response.data) ? response.data : [];
}
