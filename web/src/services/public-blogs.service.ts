import { api } from '../config/api';

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

/** One block in contentBlocks array (hero is separate; these appear after hero). */
export type ContentBlock =
  | { type: 'heading'; value: string; cols?: number }
  | { type: 'paragraph'; value: string; cols?: number }
  | { type: 'image'; imageUrl: string; cols?: number; alt?: string }
  | { type: 'heading_para'; heading: string; paragraph: string; cols?: number };

export interface PublishedBlogDetail extends PublishedBlogListItem {
  imageUrls: string | null;
  categoryId: string;
  schoolId: string;
  updatedAt: string;
  heroTitle?: string | null;
  heroParagraph?: string | null;
  heroButtonText?: string | null;
  heroButtonLink?: string | null;
  contentBlocks?: ContentBlock[] | null;
}

function buildBlogParams(params: {
  schoolId?: string | null;
  q?: string;
  from?: string;
  to?: string;
  subCategoryIds?: string[];
}): Record<string, string> {
  const p: Record<string, string> = {};
  if (params.schoolId) p.schoolId = params.schoolId;
  if (params.q?.trim()) p.q = params.q.trim();
  if (params.from && params.to) {
    p.from = params.from;
    p.to = params.to;
  }
  if (params.subCategoryIds?.length) {
    p.subCategoryIds = params.subCategoryIds.join(',');
  }
  return p;
}

const BLOG_LIST_TIMEOUT_MS = 6000;

async function getBlogListFromPath(
  path: string,
  params: Record<string, string>,
): Promise<PublishedBlogListItem[]> {
  const response = await api.get<PublishedBlogListItem[]>(path, {
    params,
    timeout: BLOG_LIST_TIMEOUT_MS,
  });
  return Array.isArray(response.data) ? response.data : [];
}

export const publicBlogsService = {
  /**
   * Tries /public/blogs then /events/blogs so blogs show even if one path 404s on the server.
   * subCategoryIds: same as news feed — only blogs in those subcategories (omit = all for that school).
   */
  list: async (params: {
    schoolId?: string | null;
    q?: string;
    from?: string;
    to?: string;
    subCategoryIds?: string[];
  }): Promise<PublishedBlogListItem[]> => {
    const query = buildBlogParams(params);
    // Prefer /events/blogs first — same app as /events/approved; avoids extra hop if /public/* isn’t proxied
    const paths = ['/events/blogs', '/public/blogs', '/events/published-blogs'];
    let lastErr: unknown;
    for (const path of paths) {
      try {
        const rows = await getBlogListFromPath(path, query);
        if (import.meta.env.DEV && path !== paths[0]) {
          console.info(`[publicBlogs] loaded from ${path}`, rows.length);
        }
        return rows;
      } catch (e) {
        lastErr = e;
      }
    }
    if (import.meta.env.DEV) {
      console.warn('[publicBlogs] all list endpoints failed', lastErr);
    }
    return [];
  },

  getById: async (id: string): Promise<PublishedBlogDetail> => {
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
    throw lastErr;
  },
};
