import { api } from '../config/api';

export interface SchoolSocialAccountPublic {
  id: string;
  platformId: string;
  platformName: string;
  pageName: string;
  icon: string;
  link: string;
}

function normalizeSchoolSocialAccount(raw: Record<string, unknown>): SchoolSocialAccountPublic | null {
  const id = raw.id;
  if (typeof id !== 'string' || !id.trim()) return null;
  return {
    id,
    platformId: String(raw.platformId ?? raw.platform_id ?? ''),
    platformName: String(raw.platformName ?? raw.platform_name ?? ''),
    pageName: String(raw.pageName ?? raw.page_name ?? ''),
    icon: String(raw.icon ?? ''),
    link: String(raw.link ?? ''),
  };
}

export async function getSchoolSocialAccounts(): Promise<SchoolSocialAccountPublic[]> {
  const response = await api.get<unknown>('/user/school-social-accounts');
  const raw = response.data;
  const list = Array.isArray(raw)
    ? raw
    : raw != null && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)
      ? (raw as { data: unknown[] }).data
      : [];
  return list
    .map((item) =>
      item != null && typeof item === 'object'
        ? normalizeSchoolSocialAccount(item as Record<string, unknown>)
        : null,
    )
    .filter((item): item is SchoolSocialAccountPublic => item != null);
}
