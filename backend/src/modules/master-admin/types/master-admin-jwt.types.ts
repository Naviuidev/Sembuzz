export type MasterAdminJwtRole = 'master_admin' | 'school_master_admin';

export type MasterAdminJwtPayload = {
  sub: string;
  role: MasterAdminJwtRole;
  loginId?: string;
  name?: string;
  email?: string;
  schoolId?: string;
  schoolName?: string;
  allowedPortalSections?: string[];
  isFirstLogin?: boolean;
};
