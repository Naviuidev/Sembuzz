import { api } from '../config/api';
import type { SupportRequestDto } from './support.service';
import type {
  CategoryAdminQueryItem,
  RaisedToSuperAdminQueryItem,
  SchoolAdminRaiseRequestDto,
  SubCategoryAdminQueryItem,
} from './school-admin-queries.service';

export type MasterAdminQueryRecipient =
  | 'super_admin'
  | 'category_admin'
  | 'subcategory_admin'
  | 'school_admin';

export type MasterAdminQueriesInbox = {
  fromCategoryAdmins: CategoryAdminQueryItem[];
  fromSubCategoryAdmins: SubCategoryAdminQueryItem[];
  toSuperAdmin: RaisedToSuperAdminQueryItem[];
};

function mapRaisePayload(data: SchoolAdminRaiseRequestDto): Record<string, string | undefined> {
  return {
    type: data.type,
    customMessage: data.type === 'custom_message' ? data.customMessage : undefined,
    description: data.type === 'custom_message' ? data.customMessage : data.description,
    meetingType: data.meetingType,
    date: data.meetingDate,
    timeZone: data.timeZone,
    timeSlot: data.timeSlot,
    attachmentUrl: data.attachmentUrl,
  };
}

export const masterAdminQueriesService = {
  listInbox: async (schoolId: string): Promise<MasterAdminQueriesInbox> => {
    const response = await api.get<MasterAdminQueriesInbox>('/master-admin/queries', {
      params: { schoolId },
    });
    return response.data;
  },

  raise: async (
    schoolId: string,
    recipient: MasterAdminQueryRecipient,
    data: SchoolAdminRaiseRequestDto,
  ): Promise<unknown> => {
    const response = await api.post('/master-admin/queries/raise', {
      schoolId,
      recipient,
      ...mapRaisePayload(data),
    });
    return response.data;
  },

  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/master-admin/queries/upload', formData);
    return response.data;
  },

  replyToCategoryAdmin: async (schoolId: string, queryId: string, message: string) => {
    const response = await api.post(`/master-admin/queries/${schoolId}/from-category-admins/${queryId}/reply`, {
      message,
    });
    return response.data;
  },

  replyToSubcategoryAdmin: async (schoolId: string, queryId: string, message: string) => {
    const response = await api.post(`/master-admin/queries/${schoolId}/from-subcategory-admins/${queryId}/reply`, {
      message,
    });
    return response.data;
  },

  sendDeveloperRequest: async (
    schoolId: string,
    data: SupportRequestDto,
  ): Promise<{ message: string; meetingLink?: string }> => {
    const response = await api.post<{ message: string; meetingLink?: string }>(
      '/master-admin/queries/developer-request',
      { schoolId, ...data },
    );
    return response.data;
  },
};
