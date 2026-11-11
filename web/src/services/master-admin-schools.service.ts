import { api } from '../config/api';
import type { ApprovedEventPublic } from './public-events.service';

export interface MasterAdminSchoolSummary {
  id: string;
  refNum: string;
  name: string;
  image: string | null;
  city: string;
  state: string | null;
  isActive: boolean;
}

export interface MasterAdminAdminRef {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface MasterAdminSchoolOverviewSubcategory {
  id: string;
  name: string;
  admins: MasterAdminAdminRef[];
  postCount: number;
}

export interface MasterAdminSchoolPostRow {
  id: string;
  schoolId?: string;
  title: string;
  imageUrls?: string | null;
  status: string;
  publishedAt: string | null;
  publishAt: string | null;
  createdAt: string;
  subCategory: {
    id: string;
    name: string;
    category: { id: string; name: string };
  };
  subCategoryAdmin: { name: string; email: string } | null;
  schoolAdmin: { name: string; email: string } | null;
}

export type MasterAdminSchoolPostDetail = ApprovedEventPublic;

export interface MasterAdminSchoolUserRow {
  id: string;
  name: string;
  email: string;
  registrationMethod: string | null;
  status: string;
  createdAt: string;
}

export interface MasterAdminSchoolBlogRow {
  id: string;
  title: string;
  status: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: { id: string; name: string };
  subCategory: { id: string; name: string };
  subCategoryAdmin: { name: string; email: string };
}

export interface MasterAdminSchoolUpcomingRow {
  id: string;
  title: string;
  description: string | null;
  imageUrls: string | null;
  scheduledTo: string;
  createdAt: string;
  category: { id: string; name: string };
  subCategory: { id: string; name: string };
  school?: { id: string; name: string; image: string | null };
}

type MasterAdminAdAdminRef = {
  name: string;
  email: string;
  category?: { name: string } | null;
};

export interface MasterAdminSchoolBannerAdRow {
  id: string;
  imageUrl: string;
  externalLink: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
  categoryAdmin: MasterAdminAdAdminRef | null;
  adsAdmin: { name: string; email: string } | null;
}

export interface MasterAdminSchoolPrivacyAdminRow {
  id: string;
  platformUserId: string;
  name: string;
  email: string;
  isActive: boolean;
  isFirstLogin: boolean;
  scope: string;
  createdAt: string;
}

export interface MasterAdminSchoolPrivacyEmailRequest {
  id: string;
  targetRole: string;
  targetName: string;
  targetEmail: string;
  initiatedByRole: string;
  initiatedByName: string;
  reason: string;
  status: string;
  proposedNewEmail: string | null;
  createdAt: string;
}

export interface MasterAdminSchoolPrivacy {
  enabledFeatures: Array<{ code: string; name: string }>;
  schoolAdmins: MasterAdminSchoolPrivacyAdminRow[];
  categoryAdmins: MasterAdminSchoolPrivacyAdminRow[];
  subCategoryAdmins: MasterAdminSchoolPrivacyAdminRow[];
  adsAdmins: MasterAdminSchoolPrivacyAdminRow[];
  emailChangeRequests: MasterAdminSchoolPrivacyEmailRequest[];
}

export interface MasterAdminSchoolSponsoredAdRow {
  id: string;
  title: string | null;
  externalLink: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
  categoryAdmin: MasterAdminAdAdminRef | null;
  adsAdmin: { name: string; email: string } | null;
}

export interface MasterAdminSchoolOverviewCategory {
  id: string;
  name: string;
  admins: MasterAdminAdminRef[];
  subcategories: MasterAdminSchoolOverviewSubcategory[];
}

export interface MasterAdminSchoolOverview {
  school: {
    id: string;
    refNum: string;
    name: string;
    image: string | null;
    country: string | null;
    state: string | null;
    city: string;
    domain: string | null;
    tenure: number | null;
    isActive: boolean;
    filtersVisibility: string | null;
    createdAt: string;
    updatedAt: string;
  };
  enabledFeatures: Array<{ code: string; name: string }>;
  schoolAdmins: MasterAdminAdminRef[];
  adsAdmins: MasterAdminAdminRef[];
  categories: MasterAdminSchoolOverviewCategory[];
  counts: {
    posts: number;
    clubs: number;
    categories: number;
    subcategories: number;
    users: number;
    bannerAds: number;
    sponsoredAds: number;
    blogs: number;
    upcoming: number;
  };
  clubs: Array<{
    id: string;
    pageName: string;
    icon: string;
    isEnabled: boolean;
    messageMode: string;
  }>;
  socialAccounts: Array<{
    id: string;
    platformName: string;
    pageName: string;
    link: string;
    icon: string;
  }>;
  directMessaging: { isEnabled: boolean };
}

export const masterAdminSchoolsService = {
  list: async (): Promise<MasterAdminSchoolSummary[]> => {
    const response = await api.get<MasterAdminSchoolSummary[]>('/master-admin/schools');
    return response.data;
  },

  getOverview: async (schoolId: string): Promise<MasterAdminSchoolOverview> => {
    const response = await api.get<MasterAdminSchoolOverview>(`/master-admin/schools/${schoolId}/overview`);
    return response.data;
  },

  listPosts: async (schoolId: string): Promise<MasterAdminSchoolPostRow[]> => {
    const response = await api.get<MasterAdminSchoolPostRow[]>(`/master-admin/schools/${schoolId}/posts`);
    return response.data;
  },

  getPost: async (schoolId: string, postId: string): Promise<MasterAdminSchoolPostDetail> => {
    const response = await api.get<MasterAdminSchoolPostDetail>(`/master-admin/schools/${schoolId}/posts/${postId}`);
    return response.data;
  },

  listUsers: async (schoolId: string): Promise<MasterAdminSchoolUserRow[]> => {
    const response = await api.get<MasterAdminSchoolUserRow[]>(`/master-admin/schools/${schoolId}/users`);
    return response.data;
  },

  listBlogs: async (schoolId: string): Promise<MasterAdminSchoolBlogRow[]> => {
    const response = await api.get<MasterAdminSchoolBlogRow[]>(`/master-admin/schools/${schoolId}/blogs`);
    return response.data;
  },

  listUpcoming: async (schoolId: string): Promise<MasterAdminSchoolUpcomingRow[]> => {
    const response = await api.get<MasterAdminSchoolUpcomingRow[]>(`/master-admin/schools/${schoolId}/upcoming`);
    return response.data;
  },

  listBannerAds: async (schoolId: string): Promise<MasterAdminSchoolBannerAdRow[]> => {
    const response = await api.get<MasterAdminSchoolBannerAdRow[]>(`/master-admin/schools/${schoolId}/banner-ads`);
    return response.data;
  },

  listSponsoredAds: async (schoolId: string): Promise<MasterAdminSchoolSponsoredAdRow[]> => {
    const response = await api.get<MasterAdminSchoolSponsoredAdRow[]>(`/master-admin/schools/${schoolId}/sponsored-ads`);
    return response.data;
  },

  getPrivacy: async (schoolId: string): Promise<MasterAdminSchoolPrivacy> => {
    const response = await api.get<MasterAdminSchoolPrivacy>(`/master-admin/schools/${schoolId}/privacy`);
    return response.data;
  },
};
