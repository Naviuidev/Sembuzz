import { api } from '../config/api';
import type { MasterAdminPortalSectionId } from '../constants/masterAdminPortalSections';

export type SchoolMasterAdminRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accessMethod: string;
  isActive: boolean;
  isFirstLogin: boolean;
  allowedPortalSections: string[];
  createdAt: string;
  school: { id: string; name: string; refNum: string; image: string | null };
};

export type ProvisionSchoolMasterAdminPayload = {
  schoolId: string;
  accessMethod: 'email' | 'sso';
  email: string;
  firstName: string;
  lastName: string;
  verificationDocumentUrl?: string;
  allowedPortalSections: MasterAdminPortalSectionId[];
};

export const masterAdminDeveloperLayerService = {
  listAdmins: async (): Promise<SchoolMasterAdminRow[]> => {
    const response = await api.get<SchoolMasterAdminRow[]>('/master-admin/developer-layer/admins');
    return response.data;
  },

  uploadDocument: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/master-admin/developer-layer/upload-document', formData);
    return response.data;
  },

  provision: async (payload: ProvisionSchoolMasterAdminPayload) => {
    const response = await api.post('/master-admin/developer-layer/provision', payload);
    return response.data;
  },
};
