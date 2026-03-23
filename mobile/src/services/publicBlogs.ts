import { api } from '../config/api';
import { imageSrc } from '../utils/image';

export interface PublishedBlogListItem {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  school: { id: string; name: string; image: string | null };
  subCategory: { id: string; name: string };
  subCategoryAdmin: { id: string; name: string };
}

export interface PublishedBlogDetail extends PublishedBlogListItem {
  imageUrls: string | null;
  contentBlocks?: Array<
    | { type: 'heading'; value: string; cols?: number }
    | { type: 'paragraph'; value: string; cols?: number }
    | { type: 'image'; imageUrl: string; cols?: number; alt?: string }
    | { type: 'heading_para'; heading: string; paragraph: string; cols?: number }
  > | null;
}

export async function listPublicBlogs(params?: {
  schoolId?: string | null;
  q?: string;
}): Promise<PublishedBlogListItem[]> {
  const query: Record<string, string> = {};
  if (params?.schoolId?.trim()) query.schoolId = params.schoolId.trim();
  if (params?.q?.trim()) query.q = params.q.trim();

  const paths = ['/events/blogs', '/public/blogs', '/events/published-blogs'];
  for (const path of paths) {
    try {
      const response = await api.get<PublishedBlogListItem[] | { data?: PublishedBlogListItem[] }>(path, {
        params: query,
      });
      if (Array.isArray(response.data)) return response.data;
      if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch {
      // try fallback path
    }
  }
  return [];
}

export async function getPublicBlogById(id: string): Promise<PublishedBlogDetail> {
  const paths = [`/public/blog/${id}`, `/events/blog/${id}`];
  let lastErr: unknown;
  for (const path of paths) {
    try {
      const response = await api.get<PublishedBlogDetail>(path);
      return response.data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('Blog not found');
}

export function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

export { imageSrc };

