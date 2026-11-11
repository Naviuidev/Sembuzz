import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterAdminSchoolsService } from '../../services/master-admin-schools.service';
import { masterAdminPostsService } from '../../services/master-admin-posts.service';

export type MasterAdminAnalyticsScope = {
  schoolId: string;
  schoolName: string;
  categoryId?: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  postId?: string;
  postTitle?: string;
};

const PUBLISHED_STATUSES = new Set(['published', 'approved']);

type Props = {
  initial?: Partial<MasterAdminAnalyticsScope>;
  onSubmit: (scope: MasterAdminAnalyticsScope) => void;
};

export function MasterAdminAnalyticsScopePicker({ initial, onSubmit }: Props) {
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const [schoolId, setSchoolId] = useState(initial?.schoolId ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [subCategoryId, setSubCategoryId] = useState(initial?.subCategoryId ?? '');
  const [postId, setPostId] = useState(initial?.postId ?? '');

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['master-admin', 'post-categories', schoolId],
    queryFn: () => masterAdminPostsService.getCategoriesForSchool(schoolId),
    enabled: Boolean(schoolId),
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['master-admin', 'analytics-post-options', schoolId],
    queryFn: () => masterAdminPostsService.list(schoolId),
    enabled: Boolean(schoolId),
  });

  useEffect(() => {
    if (initial?.schoolId) setSchoolId(initial.schoolId);
    if (initial?.categoryId) setCategoryId(initial.categoryId);
    if (initial?.subCategoryId) setSubCategoryId(initial.subCategoryId);
    if (initial?.postId) setPostId(initial.postId);
  }, [initial?.schoolId, initial?.categoryId, initial?.subCategoryId, initial?.postId]);

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);
  const selectedSchool = schoolOptions.find((s) => s.id === schoolId);
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories ?? [];
  const selectedSub = subcategories.find((s) => s.id === subCategoryId);

  const publishedPosts = useMemo(
    () => posts.filter((p) => PUBLISHED_STATUSES.has(p.status)),
    [posts],
  );

  const postOptions = useMemo(() => {
    return publishedPosts.filter((p) => {
      if (categoryId && p.subCategory.category.id !== categoryId) return false;
      if (subCategoryId && p.subCategory.id !== subCategoryId) return false;
      return true;
    });
  }, [publishedPosts, categoryId, subCategoryId]);

  useEffect(() => {
    if (postId && !postOptions.some((p) => p.id === postId)) {
      setPostId('');
    }
  }, [postId, postOptions]);

  const canSubmit = Boolean(schoolId && selectedSchool);

  const handleSchoolChange = (id: string) => {
    setSchoolId(id);
    setCategoryId('');
    setSubCategoryId('');
    setPostId('');
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setSubCategoryId('');
    setPostId('');
  };

  const handleSubCategoryChange = (id: string) => {
    setSubCategoryId(id);
    setPostId('');
  };

  const handleSubmit = () => {
    if (!canSubmit || !selectedSchool) return;
    const selectedPost = postOptions.find((p) => p.id === postId);
    onSubmit({
      schoolId,
      schoolName: selectedSchool.name,
      ...(categoryId && selectedCategory
        ? { categoryId, categoryName: selectedCategory.name }
        : {}),
      ...(subCategoryId && selectedSub
        ? { subCategoryId, subCategoryName: selectedSub.name }
        : {}),
      ...(postId && selectedPost ? { postId, postTitle: selectedPost.title } : {}),
    });
  };

  return (
    <div className="master-admin-post-target-picker master-admin-post-target-picker--progressive">
      <h2 className="master-admin-post-target-picker__title">Select analytics scope</h2>
      <p className="admin-form-hint mb-3">
        Pick a school and press Process for whole-school analytics, or narrow with category, subcategory, and/or a single post.
      </p>

      <div className="master-admin-post-target-picker__steps">
        <div className="master-admin-post-target-picker__step">
          <label className="admin-form-label" htmlFor="ma-analytics-school">
            Select school
          </label>
          <select
            id="ma-analytics-school"
            className="form-select admin-form-control"
            value={schoolId}
            onChange={(e) => handleSchoolChange(e.target.value)}
            disabled={schoolsLoading}
          >
            <option value="">Choose school…</option>
            {schoolOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {schoolId ? (
          <div className="master-admin-post-target-picker__step">
            <label className="admin-form-label" htmlFor="ma-analytics-category">
              Select category
            </label>
            <select
              id="ma-analytics-category"
              className="form-select admin-form-control"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={categoriesLoading || categories.length === 0}
            >
              <option value="">All categories (whole school)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!categoriesLoading && categories.length === 0 ? (
              <p className="admin-form-hint mt-2 mb-0">No categories for this school.</p>
            ) : null}
          </div>
        ) : null}

        {categoryId ? (
          <div className="master-admin-post-target-picker__step">
            <label className="admin-form-label" htmlFor="ma-analytics-subcategory">
              Select subcategory <span className="text-muted fw-normal">(optional)</span>
            </label>
            <select
              id="ma-analytics-subcategory"
              className="form-select admin-form-control"
              value={subCategoryId}
              onChange={(e) => handleSubCategoryChange(e.target.value)}
              disabled={subcategories.length === 0}
            >
              <option value="">All subcategories in this category</option>
              {subcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {schoolId ? (
          <div className="master-admin-post-target-picker__step">
            <label className="admin-form-label" htmlFor="ma-analytics-post">
              Post title <span className="text-muted fw-normal">(optional)</span>
            </label>
            <select
              id="ma-analytics-post"
              className="form-select admin-form-control"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              disabled={postsLoading}
            >
              <option value="">All published posts in scope</option>
              {postOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || 'Untitled'}
                </option>
              ))}
            </select>
            {!postsLoading && postOptions.length === 0 ? (
              <p className="admin-form-hint mt-2 mb-0">No published posts in this scope yet.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {schoolId ? (
        <div className="master-admin-post-target-picker__actions">
          <button type="button" className="admin-btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
            Process
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function MasterAdminAnalyticsScopeBreadcrumb({ scope }: { scope: MasterAdminAnalyticsScope }) {
  const parts = [
    scope.schoolName,
    scope.categoryName,
    scope.subCategoryName,
    scope.postTitle,
  ].filter(Boolean);

  return (
    <nav className="master-admin-post-breadcrumb" aria-label="Analytics scope">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`}>
          {i > 0 ? (
            <span className="master-admin-post-breadcrumb__sep" aria-hidden>
              /
            </span>
          ) : null}
          <span
            className={
              i === parts.length - 1
                ? 'master-admin-post-breadcrumb__item master-admin-post-breadcrumb__item--current'
                : 'master-admin-post-breadcrumb__item'
            }
          >
            {part}
          </span>
        </span>
      ))}
    </nav>
  );
}
