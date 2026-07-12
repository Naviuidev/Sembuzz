import { api } from '../config/api';

export type ClubGroupMembershipStatus = 'pending' | 'approved' | 'banned';

export interface CategoryAdminClubGroupMembershipRow {
  id: string;
  status: ClubGroupMembershipStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profilePicUrl: string | null;
    registrationMethod: string | null;
    createdAt: string;
  };
  school: { id: string; name: string };
  groupChat: {
    id: string;
    pageName: string;
    icon: string;
    clubKey: string;
  };
  reviewedBy: { id: string; name: string; email: string } | null;
}

export const categoryAdminClubGroupMembershipsService = {
  list: async (status: ClubGroupMembershipStatus): Promise<CategoryAdminClubGroupMembershipRow[]> => {
    const { data } = await api.get<CategoryAdminClubGroupMembershipRow[]>(
      '/category-admin/club-group-memberships',
      { params: { status } },
    );
    return Array.isArray(data) ? data : [];
  },

  approve: async (id: string) => {
    const { data } = await api.post(`/category-admin/club-group-memberships/${id}/approve`);
    return data;
  },

  ban: async (id: string) => {
    const { data } = await api.post(`/category-admin/club-group-memberships/${id}/ban`);
    return data;
  },
};
