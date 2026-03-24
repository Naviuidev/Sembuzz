import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same keys as web `user-category-prefs.ts` for cross-device parity. */
const USER_CATEGORY_DONE_KEY = (userId: string) => `sembuzz-user-${userId}-category-done`;
const USER_SUBCATEGORY_IDS_KEY = (userId: string) => `sembuzz-user-${userId}-subcategory-ids`;

export async function getUserCategoryDone(userId: string): Promise<'true' | 'skip' | null> {
  const v = await AsyncStorage.getItem(USER_CATEGORY_DONE_KEY(userId));
  if (v === 'true' || v === 'skip') return v;
  return null;
}

export async function getUserSubCategoryIds(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(USER_SUBCATEGORY_IDS_KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function setUserCategoryDone(userId: string, done: 'true' | 'skip') {
  await AsyncStorage.setItem(USER_CATEGORY_DONE_KEY(userId), done);
}

export async function setUserSubCategoryIds(userId: string, ids: string[]) {
  await AsyncStorage.setItem(USER_SUBCATEGORY_IDS_KEY(userId), JSON.stringify(ids));
}
