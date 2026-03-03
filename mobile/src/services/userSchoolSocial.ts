import { api } from '../config/api';

export interface SchoolSocialAccountPublic {
  id: string;
  platformId: string;
  platformName: string;
  pageName: string;
  icon: string;
  link: string;
}

export async function getSchoolSocialAccounts(): Promise<SchoolSocialAccountPublic[]> {
  const response = await api.get<SchoolSocialAccountPublic[]>('/user/school-social-accounts');
  return Array.isArray(response.data) ? response.data : [];
}
