import { api } from '../config/api';
import type { MasterAdminSchoolSummary } from './master-admin-schools.service';

export type MasterAdminDashboardSummary = {
  schools: { total: number; active: number; inactive: number };
  users: number;
  posts: { total: number; pending: number; published: number };
  blogs: { total: number; savedDrafts: number };
  upcoming: number;
  external: { pipelinePending: number; postRequestsPending: number; pendingTotal: number };
  recentSchools: MasterAdminSchoolSummary[];
};

export const masterAdminDashboardService = {
  getSummary: async (): Promise<MasterAdminDashboardSummary> => {
    const response = await api.get<MasterAdminDashboardSummary>('/master-admin/dashboard/summary');
    return response.data;
  },
};
