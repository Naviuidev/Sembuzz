import { api } from '../config/api';

export type SubcategoryExternalLinkRow = {
  id: string;
  status: string;
  subcategoryAdminMessage: string | null;
  createdAt: string;
  updatedAt: string;
  externalCategory: { id: string; name: string };
  externalAdmin: { id: string; name: string; email: string; refNum: string };
  subCategory: { id: string; name: string };
  school: { id: string; name: string };
  threadMessages?: Array<{ id: string; senderRole: string; body: string; createdAt: string }>;
};

export type SubcategoryExternalPostRow = {
  id: string;
  contentType?: string;
  title: string;
  description: string | null;
  status: string;
  subcategoryStatus: string | null;
  subcategoryAdminMessage: string | null;
  imageUrls: string | null;
  externalLink: string | null;
  eventDate: string | null;
  companyName: string | null;
  companyLogoUrl: string | null;
  jobType: string | null;
  workMode: string | null;
  jobLocation: string | null;
  eligibilityRequirements: string | null;
  skillsRequired: string | null;
  experienceRequired: string | null;
  salaryStipend: string | null;
  applicationDeadline: string | null;
  applicationMethod: string | null;
  applicationTarget: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  postedByOrganization: string | null;
  jobPublishStatus: string | null;
  applyButtonEnabled: boolean;
  saveJobButtonEnabled: boolean;
  applyButtonUrl: string | null;
  createdAt: string;
  updatedAt: string;
  externalCategory: { id: string; name: string };
  externalAdmin: { id: string; name: string; email: string; refNum: string };
  subCategory: { id: string; name: string } | null;
  school: { id: string; name: string };
  subcategoryThreadMessages?: Array<{ id: string; senderRole: string; body: string; createdAt: string }>;
};

export const subcategoryAdminExternalConfigService = {
  linkPendingCount: async () => {
    const res = await api.get<{ pending: number }>('/subcategory-admin/external-config/category-links/pending-count');
    return res.data;
  },
  postPendingCount: async () => {
    const res = await api.get<{ pending: number }>('/subcategory-admin/external-config/posts/pending-count');
    return res.data;
  },
  listCategoryLinks: async (): Promise<SubcategoryExternalLinkRow[]> => {
    const res = await api.get('/subcategory-admin/external-config/category-links');
    return res.data;
  },
  getCategoryLink: async (id: string): Promise<SubcategoryExternalLinkRow> => {
    const res = await api.get(`/subcategory-admin/external-config/category-links/${id}`);
    return res.data;
  },
  listPosts: async (): Promise<SubcategoryExternalPostRow[]> => {
    const res = await api.get('/subcategory-admin/external-config/posts');
    return res.data;
  },
  getPost: async (id: string): Promise<SubcategoryExternalPostRow> => {
    const res = await api.get(`/subcategory-admin/external-config/posts/${id}`);
    return res.data;
  },
  linkSendQuery: (id: string, message: string) =>
    api.post(`/subcategory-admin/external-config/category-links/${id}/send-query`, { message }),
  linkReply: (id: string, message: string) =>
    api.post(`/subcategory-admin/external-config/category-links/${id}/reply`, { message }),
  linkApprove: (id: string, message?: string) =>
    api.post(`/subcategory-admin/external-config/category-links/${id}/approve`, { message }),
  linkReject: (id: string, message?: string) =>
    api.post(`/subcategory-admin/external-config/category-links/${id}/reject`, { message }),
  linkBan: (id: string, message?: string) =>
    api.post(`/subcategory-admin/external-config/category-links/${id}/ban`, { message }),
  postSendQuery: (id: string, message: string) =>
    api.post(`/subcategory-admin/external-config/posts/${id}/send-query`, { message }),
  postReply: (id: string, message: string) =>
    api.post(`/subcategory-admin/external-config/posts/${id}/reply`, { message }),
  postApprove: (id: string, message?: string) =>
    api.post(`/subcategory-admin/external-config/posts/${id}/approve`, { message }),
  postReject: (id: string, message?: string) =>
    api.post(`/subcategory-admin/external-config/posts/${id}/reject`, { message }),
  postBan: (id: string, message?: string) =>
    api.post(`/subcategory-admin/external-config/posts/${id}/ban`, { message }),
};
