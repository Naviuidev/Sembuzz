import { api } from '../config/api';

export type AdminEmailChangeTargetRole = 'category_admin' | 'subcategory_admin' | 'ads_admin';

export type AdminEmailChangeRequest = {
  id: string;
  targetRole: AdminEmailChangeTargetRole;
  targetAdminId: string;
  targetName: string;
  targetEmail: string;
  initiatedByRole: string;
  initiatedByName: string;
  reason: string;
  status: string;
  proposedNewEmail?: string | null;
  createdAt: string;
};

type InitiateResponse = {
  requestId: string;
  maskedEmail: string;
  message: string;
};

function createService(basePath: 'school-admin' | 'category-admin') {
  return {
    async initiate(
      targetRole: AdminEmailChangeTargetRole,
      targetAdminId: string,
      reason: string,
    ): Promise<InitiateResponse> {
      const { data } = await api.post<InitiateResponse>(`/${basePath}/email-change-requests/initiate`, {
        targetRole,
        targetAdminId,
        reason,
      });
      return data;
    },

    async confirmOtp(requestId: string, otp: string): Promise<{ message: string; requestId: string }> {
      const { data } = await api.post<{ message: string; requestId: string }>(
        `/${basePath}/email-change-requests/${requestId}/confirm-otp`,
        { otp },
      );
      return data;
    },
  };
}

export const schoolAdminEmailChangeRequestsService = {
  ...createService('school-admin'),
  async listPending(): Promise<AdminEmailChangeRequest[]> {
    const { data } = await api.get<AdminEmailChangeRequest[]>('/school-admin/email-change-requests');
    return data;
  },

  async configureEmail(
    requestId: string,
    newEmail: string,
  ): Promise<{ message: string; maskedEmail: string }> {
    const { data } = await api.post<{ message: string; maskedEmail: string }>(
      `/school-admin/email-change-requests/${requestId}/configure-email`,
      { newEmail },
    );
    return data;
  },

  async confirmNewEmail(
    requestId: string,
    otp: string,
  ): Promise<{ message: string; newEmail: string; welcomeEmailSent?: boolean }> {
    const { data } = await api.post<{ message: string; newEmail: string; welcomeEmailSent?: boolean }>(
      `/school-admin/email-change-requests/${requestId}/confirm-new-email`,
      { otp },
    );
    return data;
  },
};

export const categoryAdminEmailChangeRequestsService = createService('category-admin');

export function formatAdminRoleLabel(role: AdminEmailChangeTargetRole): string {
  if (role === 'category_admin') return 'Category admin';
  if (role === 'subcategory_admin') return 'Subcategory admin';
  return 'Ads admin';
}
