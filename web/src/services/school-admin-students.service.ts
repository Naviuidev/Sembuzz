import { api } from '../config/api';

export interface SchoolStudent {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  profilePicUrl: string | null;
  verificationDocUrl: string | null;
  additionalVerificationDocUrl: string | null;
  registrationMethod: string | null;
  status: string;
  createdAt: string;
}

export const schoolAdminStudentsService = {
  getApproved: async (): Promise<SchoolStudent[]> => {
    const response = await api.get<SchoolStudent[]>('/school-admin/students/approved');
    return response.data;
  },

  getAutomated: async (): Promise<SchoolStudent[]> => {
    const response = await api.get<SchoolStudent[]>('/school-admin/students/automated');
    return response.data;
  },

  ban: async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(
      `/school-admin/students/${userId}/ban`,
    );
    return response.data;
  },

  unban: async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(
      `/school-admin/students/${userId}/unban`,
    );
    return response.data;
  },
};
