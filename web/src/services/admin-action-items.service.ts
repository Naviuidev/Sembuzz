import type { QueryClient } from '@tanstack/react-query';
import { api } from '../config/api';

export interface AdminActionItem {
  id: string;
  kind: string;
  title: string;
  summary: string;
  href: string;
  count: number;
  createdAt?: string;
}

export interface AdminActionItemsResponse {
  totalCount: number;
  items: AdminActionItem[];
}

export type AdminActionItemsRole =
  | 'school-admin'
  | 'category-admin'
  | 'subcategory-admin'
  | 'super-admin'
  | 'ads-admin';

const ADMIN_ACTION_ITEMS_ROLES = new Set<AdminActionItemsRole>([
  'school-admin',
  'category-admin',
  'subcategory-admin',
  'super-admin',
  'ads-admin',
]);

export function isAdminActionItemsRole(value: string): value is AdminActionItemsRole {
  return ADMIN_ACTION_ITEMS_ROLES.has(value as AdminActionItemsRole);
}

export const adminActionItemsQueryKey = (role: AdminActionItemsRole) =>
  ['admin-action-items', role] as const;

export function fetchAdminActionItems(role: AdminActionItemsRole) {
  return api.get<AdminActionItemsResponse>(`/${role}/action-items`).then((r) => r.data);
}

/** Refetch navbar bell counts after resolving pending work. */
export function invalidateAdminActionItems(
  queryClient: QueryClient,
  role: AdminActionItemsRole,
) {
  return queryClient.invalidateQueries({ queryKey: adminActionItemsQueryKey(role) });
}

/** Uses list/query prefix (e.g. school-admin) from review panels. */
export function invalidateAdminActionItemsForPrefix(
  queryClient: QueryClient,
  queryKeyPrefix: string,
) {
  if (isAdminActionItemsRole(queryKeyPrefix)) {
    void invalidateAdminActionItems(queryClient, queryKeyPrefix);
  }
  /** Category messaging reviews also affect school-admin bell totals. */
  if (queryKeyPrefix === 'category-admin') {
    void invalidateAdminActionItems(queryClient, 'school-admin');
  }
}

export function invalidateAdminActionItemsMany(
  queryClient: QueryClient,
  roles: AdminActionItemsRole[],
) {
  roles.forEach((role) => {
    void invalidateAdminActionItems(queryClient, role);
  });
}
