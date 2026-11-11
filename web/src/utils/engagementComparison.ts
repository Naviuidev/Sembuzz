export type EngagementAnalyticsPost = {
  id: string;
  title: string;
  imageUrls?: string | null;
  subCategory?: {
    id: string;
    name: string;
    category?: { id: string; name: string };
  };
};

export type EngagementComparisonLevel = 'school' | 'category' | 'subcategory' | 'post';

export type EngagementComparisonRow = {
  id: string;
  label: string;
  likes: number;
  comments: number;
  saved: number;
  total: number;
  postCount: number;
};

export function resolveEngagementComparisonLevel(scope: {
  postId?: string;
  subCategoryId?: string;
  categoryId?: string;
}): EngagementComparisonLevel {
  if (scope.postId) return 'post';
  if (scope.subCategoryId) return 'subcategory';
  if (scope.categoryId) return 'category';
  return 'school';
}

const LEVEL_TITLES: Record<EngagementComparisonLevel, string> = {
  school: 'Category comparison (school)',
  category: 'Subcategory comparison',
  subcategory: 'Post comparison',
  post: 'Post engagement',
};

export function engagementComparisonTitle(level: EngagementComparisonLevel): string {
  return LEVEL_TITLES[level];
}

export function buildEngagementComparisonRows(
  posts: EngagementAnalyticsPost[],
  likes: Record<string, number>,
  commentCounts: Record<string, number>,
  savedCounts: Record<string, number>,
  level: EngagementComparisonLevel,
): EngagementComparisonRow[] {
  const groups = new Map<string, { label: string; postIds: string[] }>();

  for (const post of posts) {
    let key: string;
    let label: string;
    switch (level) {
      case 'school':
        key = post.subCategory?.category?.id ?? 'unknown';
        label = post.subCategory?.category?.name ?? 'Unknown category';
        break;
      case 'category':
        key = post.subCategory?.id ?? 'unknown';
        label = post.subCategory?.name ?? 'Unknown subcategory';
        break;
      case 'subcategory':
      case 'post':
        key = post.id;
        label = post.title || 'Untitled';
        break;
      default:
        key = post.id;
        label = post.title || 'Untitled';
    }
    const existing = groups.get(key) ?? { label, postIds: [] };
    existing.postIds.push(post.id);
    groups.set(key, existing);
  }

  const rows: EngagementComparisonRow[] = [];
  for (const [id, g] of groups) {
    let likesSum = 0;
    let commentsSum = 0;
    let savedSum = 0;
    for (const pid of g.postIds) {
      likesSum += likes[pid] ?? 0;
      commentsSum += commentCounts[pid] ?? 0;
      savedSum += savedCounts[pid] ?? 0;
    }
    rows.push({
      id,
      label: g.label,
      likes: likesSum,
      comments: commentsSum,
      saved: savedSum,
      total: likesSum + commentsSum + savedSum,
      postCount: g.postIds.length,
    });
  }

  return rows.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}
