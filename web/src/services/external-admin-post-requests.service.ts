import { api } from '../config/api';

export type ExternalPostThreadMessage = {
  id: string;
  senderRole: 'external_admin' | 'school_admin' | 'system';
  body: string;
  createdAt: string;
};

export type ExternalPostRequestRow = {
  id: string;
  contentType?: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  imageUrls: string | null;
  eventDate: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventLocation: string | null;
  actionButtons: string | null;
  commentsEnabled: boolean;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  jobType?: string | null;
  workMode?: string | null;
  jobLocation?: string | null;
  eligibilityRequirements?: string | null;
  skillsRequired?: string | null;
  experienceRequired?: string | null;
  salaryStipend?: string | null;
  applicationDeadline?: string | null;
  applicationMethod?: string | null;
  applicationTarget?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  postedByOrganization?: string | null;
  jobPublishStatus?: string | null;
  applyButtonEnabled?: boolean;
  saveJobButtonEnabled?: boolean;
  applyButtonUrl?: string | null;
  offerCategory?: string | null;
  originalPrice?: string | null;
  offerPriceDiscount?: string | null;
  couponCode?: string | null;
  offerValidFrom?: string | null;
  offerValidUntil?: string | null;
  howToRedeem?: string | null;
  redemptionUrl?: string | null;
  termsAndConditions?: string | null;
  offerContactInfo?: string | null;
  offerPublishStatus?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  maximumDiscount?: string | null;
  minimumPurchase?: string | null;
  usageLimit?: string | null;
  redemptionsPerStudent?: string | null;
  applicableLocations?: string | null;
  offerAvailability?: string | null;
  studentIdRequired?: boolean;
  campaignType?: string | null;
  campaignTargetAudience?: string | null;
  status: string;
  schoolAdminMessage: string | null;
  createdAt: string;
  updatedAt: string;
  school: { id: string; name: string; city: string; refNum: string };
  externalCategory: { id: string; name: string };
  externalAdmin?: { id: string; name: string; email: string; refNum: string };
  threadMessages?: ExternalPostThreadMessage[];
};

export const externalAdminPostRequestsService = {
  listRequests: async (): Promise<ExternalPostRequestRow[]> => {
    const res = await api.get<ExternalPostRequestRow[]>('/external-admin/post-requests/requests');
    return res.data;
  },

  summary: async (): Promise<{ schoolQueries: number }> => {
    const res = await api.get<{ schoolQueries: number }>('/external-admin/post-requests/requests/summary');
    return res.data;
  },

  listApprovedSchools: async (externalCategoryId: string) => {
    const res = await api.get<Array<{ id: string; name: string; city: string; refNum: string }>>(
      '/external-admin/post-requests/approved-schools',
      { params: { externalCategoryId } },
    );
    return res.data;
  },

  getRequest: async (id: string): Promise<ExternalPostRequestRow> => {
    const res = await api.get<ExternalPostRequestRow>(`/external-admin/post-requests/requests/${id}`);
    return res.data;
  },

  reply: async (id: string, message: string) => {
    const res = await api.post(`/external-admin/post-requests/requests/${id}/reply`, { message });
    return res.data;
  },

  createCampaignRequest: async (payload: {
    externalCategoryId: string;
    schoolId: string;
    campaignTitle: string;
    organizationName: string;
    companyLogoUrl?: string;
    campaignType: string;
    description: string;
    bannerImageUrl: string;
    startDate: string;
    endDate: string;
    targetAudience: string;
    eligibility: string;
    locationOrOnline: string;
    registrationUrl: string;
    registrationDeadline?: string;
    contactEmail?: string;
    termsAndConditions?: string;
    postedByOrganization: string;
    publishStatus: 'draft' | 'published' | 'expired';
  }) => {
    const res = await api.post('/external-admin/post-requests/campaigns', payload);
    return res.data;
  },

  createOfferRequest: async (payload: {
    externalCategoryId: string;
    schoolId: string;
    offerTitle: string;
    brandName: string;
    brandLogoUrl?: string;
    offerCategory: string;
    description: string;
    bannerImageUrl: string;
    originalPrice?: string;
    offerPriceDiscount: string;
    couponCode?: string;
    validFrom: string;
    validUntil: string;
    eligibility: string;
    howToRedeem: string;
    redemptionUrl: string;
    termsAndConditions: string;
    postedByOrganization: string;
    offerPublishStatus: 'draft' | 'published' | 'expired';
  }) => {
    const res = await api.post('/external-admin/post-requests/offers', payload);
    return res.data;
  },

  createJobRequest: async (payload: {
    externalCategoryId: string;
    schoolId: string;
    subCategoryId?: string;
    jobTitle: string;
    companyName: string;
    companyLogoUrl?: string;
    jobType: string;
    workMode: string;
    location: string;
    jobDescription: string;
    eligibilityRequirements: string;
    skillsRequired: string;
    experienceRequired: string;
    salaryStipend: string;
    applicationDeadline: string;
    applicationMethod: 'external_url' | 'email';
    applicationTarget: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    postedByOrganization: string;
    jobPublishStatus: 'draft' | 'published' | 'closed';
    applyButtonEnabled: boolean;
    saveJobButtonEnabled: boolean;
    applyButtonUrl?: string;
  }) => {
    const res = await api.post('/external-admin/post-requests/jobs', payload);
    return res.data;
  },

  createRequest: async (payload: {
    externalCategoryId: string;
    schoolId: string;
    subCategoryId: string;
    title: string;
    description?: string;
    externalLink?: string;
    imageUrls?: string;
    eventDate?: string;
    eventStartTime?: string;
    eventEndTime?: string;
    eventLocation?: string;
    actionButtons?: string;
    commentsEnabled?: boolean;
  }) => {
    const res = await api.post('/external-admin/post-requests/requests', payload);
    return res.data;
  },

  listSchoolSubcategories: async (schoolId: string, externalCategoryId: string) => {
    const res = await api.get<Array<{ id: string; name: string; category: { name: string } }>>(
      '/external-admin/category-subcategory-links/school-subcategories',
      { params: { schoolId, externalCategoryId } },
    );
    return res.data;
  },

  requestCategorySubcategoryLink: async (externalCategoryId: string, subCategoryId: string) => {
    const res = await api.post('/external-admin/category-subcategory-links/requests', {
      externalCategoryId,
      subCategoryId,
    });
    return res.data;
  },

  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<{ url: string }>('/external-admin/post-requests/upload-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },
};
