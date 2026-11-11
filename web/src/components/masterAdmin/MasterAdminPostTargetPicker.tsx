import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterAdminSchoolsService } from '../../services/master-admin-schools.service';
import { masterAdminPostsService } from '../../services/master-admin-posts.service';

export type MasterAdminPostTarget = {
  schoolId: string;
  schoolName: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
};

type Props = {
  heading?: string;
  submitLabel?: string;
  initial?: Partial<MasterAdminPostTarget>;
  onCancel?: () => void;
  submitDisabled?: boolean;
  /** Progressive steps for create; inline shows all dropdowns (e.g. publish modal). */
  variant?: 'progressive' | 'inline';
  /** When set, school dropdown is fixed to initial school. */
  lockSchool?: boolean;
  onSubmit: (target: MasterAdminPostTarget) => void;
};

export function MasterAdminPostTargetPicker({
  heading = 'Select where this post belongs',
  submitLabel = 'Process',
  initial,
  onCancel,
  submitDisabled,
  variant = 'progressive',
  lockSchool = false,
  onSubmit,
}: Props) {
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const [schoolId, setSchoolId] = useState(initial?.schoolId ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [subCategoryId, setSubCategoryId] = useState(initial?.subCategoryId ?? '');

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['master-admin', 'post-categories', schoolId],
    queryFn: () => masterAdminPostsService.getCategoriesForSchool(schoolId),
    enabled: Boolean(schoolId),
  });

  useEffect(() => {
    if (initial?.schoolId) setSchoolId(initial.schoolId);
    if (initial?.categoryId) setCategoryId(initial.categoryId);
    if (initial?.subCategoryId) setSubCategoryId(initial.subCategoryId);
  }, [initial?.schoolId, initial?.categoryId, initial?.subCategoryId]);

  const selectedSchool = schools.find((s) => s.id === schoolId);
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories ?? [];
  const selectedSub = subcategories.find((s) => s.id === subCategoryId);

  const canSubmit = Boolean(schoolId && categoryId && subCategoryId && selectedSchool && selectedCategory && selectedSub);

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);

  const handleSchoolChange = (id: string) => {
    setSchoolId(id);
    setCategoryId('');
    setSubCategoryId('');
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setSubCategoryId('');
  };

  const handleSubmit = () => {
    if (!canSubmit || !selectedSchool || !selectedCategory || !selectedSub) return;
    onSubmit({
      schoolId,
      schoolName: selectedSchool.name,
      categoryId,
      categoryName: selectedCategory.name,
      subCategoryId,
      subCategoryName: selectedSub.name,
    });
  };

  const showCategory = variant === 'inline' || Boolean(schoolId);
  const showSubcategory = variant === 'inline' || Boolean(categoryId);
  const showProcess = variant === 'inline' ? canSubmit : Boolean(subCategoryId);

  const schoolField = (
    <div className={variant === 'progressive' ? 'master-admin-post-target-picker__step' : 'col-md-4'}>
      <label className="admin-form-label" htmlFor="ma-post-school">
        Select school
      </label>
      <select
        id="ma-post-school"
        className="form-select admin-form-control"
        value={schoolId}
        onChange={(e) => handleSchoolChange(e.target.value)}
        disabled={schoolsLoading || lockSchool}
      >
        <option value="">Choose school…</option>
        {schoolOptions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );

  const categoryField = showCategory ? (
    <div className={variant === 'progressive' ? 'master-admin-post-target-picker__step' : 'col-md-4'}>
      <label className="admin-form-label" htmlFor="ma-post-category">
        Select category
      </label>
      <select
        id="ma-post-category"
        className="form-select admin-form-control"
        value={categoryId}
        onChange={(e) => handleCategoryChange(e.target.value)}
        disabled={!schoolId || categoriesLoading || categories.length === 0}
      >
        <option value="">Choose category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {schoolId && !categoriesLoading && categories.length === 0 ? (
        <p className="admin-form-hint mt-2 mb-0">No categories for this school.</p>
      ) : null}
    </div>
  ) : null;

  const subcategoryField = showSubcategory ? (
    <div className={variant === 'progressive' ? 'master-admin-post-target-picker__step' : 'col-md-4'}>
      <label className="admin-form-label" htmlFor="ma-post-subcategory">
        Select subcategory
      </label>
      <select
        id="ma-post-subcategory"
        className="form-select admin-form-control"
        value={subCategoryId}
        onChange={(e) => setSubCategoryId(e.target.value)}
        disabled={!categoryId || subcategories.length === 0}
      >
        <option value="">Choose subcategory…</option>
        {subcategories.map((sc) => (
          <option key={sc.id} value={sc.id}>
            {sc.name}
          </option>
        ))}
      </select>
      {categoryId && subcategories.length === 0 ? (
        <p className="admin-form-hint mt-2 mb-0">No subcategories in this category.</p>
      ) : null}
    </div>
  ) : null;

  return (
    <div
      className={`master-admin-post-target-picker${
        variant === 'progressive' ? ' master-admin-post-target-picker--progressive' : ''
      }`}
    >
      {heading ? <h2 className="master-admin-post-target-picker__title">{heading}</h2> : null}

      {variant === 'progressive' ? (
        <div className="master-admin-post-target-picker__steps">
          {schoolField}
          {categoryField}
          {subcategoryField}
        </div>
      ) : (
        <div className="row g-3 align-items-end">
          {schoolField}
          {categoryField}
          {subcategoryField}
        </div>
      )}

      {showProcess || onCancel ? (
        <div className="master-admin-post-target-picker__actions">
          {onCancel ? (
            <button type="button" className="admin-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
          {showProcess ? (
            <button
              type="button"
              className="admin-btn-primary"
              disabled={!canSubmit || submitDisabled}
              onClick={handleSubmit}
            >
              {submitLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function MasterAdminPostTargetBreadcrumb({ target }: { target: MasterAdminPostTarget }) {
  return (
    <nav className="master-admin-post-breadcrumb" aria-label="Post target">
      <span className="master-admin-post-breadcrumb__item">{target.schoolName}</span>
      <span className="master-admin-post-breadcrumb__sep" aria-hidden>
        /
      </span>
      <span className="master-admin-post-breadcrumb__item">{target.categoryName}</span>
      <span className="master-admin-post-breadcrumb__sep" aria-hidden>
        /
      </span>
      <span className="master-admin-post-breadcrumb__item master-admin-post-breadcrumb__item--current">
        {target.subCategoryName}
      </span>
    </nav>
  );
}
