import { api } from '../config/api';

export interface SchoolSocialAccountPublic {
  id: string;
  platformId: string;
  platformName: string;
  pageName: string;
  icon: string;
  link: string;
}

export const userSchoolSocialService = {
  getForMySchool: async (): Promise<SchoolSocialAccountPublic[]> => {
    const response = await api.get<SchoolSocialAccountPublic[]>('/user/school-social-accounts');
    return response.data;
  },
};
