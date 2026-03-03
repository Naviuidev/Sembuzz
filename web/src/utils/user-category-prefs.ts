const USER_CATEGORY_DONE_KEY = (userId: string) => `sembuzz-user-${userId}-category-done`;
const USER_SUBCATEGORY_IDS_KEY = (userId: string) => `sembuzz-user-${userId}-subcategory-ids`;

export function getUserCategoryDone(userId: string): 'true' | 'skip' | null {
  const v = localStorage.getItem(USER_CATEGORY_DONE_KEY(userId));
  if (v === 'true' || v === 'skip') return v;
  return null;
}

export function getUserSubCategoryIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(USER_SUBCATEGORY_IDS_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function setUserCategoryDone(userId: string, done: 'true' | 'skip') {
  localStorage.setItem(USER_CATEGORY_DONE_KEY(userId), done);
}

export function setUserSubCategoryIds(userId: string, ids: string[]) {
  localStorage.setItem(USER_SUBCATEGORY_IDS_KEY(userId), JSON.stringify(ids));
}
