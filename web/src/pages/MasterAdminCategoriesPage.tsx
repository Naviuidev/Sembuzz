import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { masterAdminSchoolsService } from '../services/master-admin-schools.service';
import { masterAdminCategoriesService } from '../services/master-admin-categories.service';
import type { Category, SubCategory } from '../services/categories.service';

type Phase = 'browse' | 'create' | 'edit';

type DeleteModalState =
  | { mode: 'blocked'; category: Category }
  | { mode: 'confirm'; category: Category }
  | null;

function mutationErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function categoriesQueryKey(schoolId: string) {
  return ['master-admin', 'categories', schoolId] as const;
}

export function MasterAdminCategoriesPage() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const queryClient = useQueryClient();

  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [phase, setPhase] = useState<Phase>('browse');
  const [composerSchoolId, setComposerSchoolId] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);

  const [createName, setCreateName] = useState('');
  const [createSubs, setCreateSubs] = useState<string[]>([]);
  const [newSubDraft, setNewSubDraft] = useState('');

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);
  const selectedSchool = schoolOptions.find((s) => s.id === selectedSchoolId);
  const composerSchool = schoolOptions.find((s) => s.id === composerSchoolId);

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: categoriesQueryKey(selectedSchoolId),
    queryFn: () => masterAdminCategoriesService.list(selectedSchoolId),
    enabled: Boolean(selectedSchoolId),
  });

  const visibleCategories = useMemo(() => {
    if (!filterCategoryId) return categories;
    return categories.filter((c) => c.id === filterCategoryId);
  }, [categories, filterCategoryId]);

  useEffect(() => {
    if (editingCategory && categories.length > 0) {
      const fresh = categories.find((c) => c.id === editingCategory.id);
      if (fresh) setEditingCategory(fresh);
    }
  }, [categories, editingCategory?.id]);

  const invalidate = (schoolId: string) => {
    void queryClient.invalidateQueries({ queryKey: categoriesQueryKey(schoolId) });
  };

  const createMutation = useMutation({
    mutationFn: (payload: { schoolId: string; name: string; subcategories?: string[] }) =>
      masterAdminCategoriesService.create(payload.schoolId, {
        name: payload.name,
        subcategories: payload.subcategories,
      }),
    onSuccess: (_data, vars) => {
      setSelectedSchoolId(vars.schoolId);
      invalidate(vars.schoolId);
      setPhase('browse');
      setCreateName('');
      setCreateSubs([]);
      setNewSubDraft('');
      setComposerSchoolId('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      masterAdminCategoriesService.update(selectedSchoolId, id, { name }),
    onSuccess: () => {
      invalidate(selectedSchoolId);
      setPhase('browse');
      setEditingCategory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterAdminCategoriesService.delete(selectedSchoolId, id),
    onSuccess: () => {
      invalidate(selectedSchoolId);
      setPhase('browse');
      setEditingCategory(null);
      setFilterCategoryId('');
      setDeleteModal(null);
    },
  });

  const updateSubMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      masterAdminCategoriesService.updateSubCategory(selectedSchoolId, id, { name }),
    onSuccess: () => {
      invalidate(selectedSchoolId);
      setEditingSubCategoryId(null);
      setEditSubName('');
    },
  });

  const deleteSubMutation = useMutation({
    mutationFn: (id: string) => masterAdminCategoriesService.deleteSubCategory(selectedSchoolId, id),
    onSuccess: () => {
      invalidate(selectedSchoolId);
    },
  });

  const startCreate = () => {
    setComposerSchoolId(selectedSchoolId);
    setPhase('create');
    setEditingCategory(null);
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setPhase('edit');
    setFilterCategoryId(category.id);
  };

  const exitComposer = () => {
    setPhase('browse');
    setEditingCategory(null);
    setEditingSubCategoryId(null);
    setCreateName('');
    setCreateSubs([]);
    setComposerSchoolId('');
  };

  const handleRequestDeleteCategory = (category: Category) => {
    if (category.subcategories.length > 0) {
      setDeleteModal({ mode: 'blocked', category });
      return;
    }
    setDeleteModal({ mode: 'confirm', category });
  };

  const handleConfirmDeleteCategory = () => {
    if (deleteModal?.mode !== 'confirm') return;
    deleteMutation.mutate(deleteModal.category.id);
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!composerSchoolId) {
      window.alert('Select a school for this category.');
      return;
    }
    const trimmed = createName.trim();
    if (!trimmed) {
      window.alert('Enter a category name');
      return;
    }
    createMutation.mutate({
      schoolId: composerSchoolId,
      name: trimmed,
      subcategories: createSubs.length ? createSubs : undefined,
    });
  };

  const handleSaveCategory = () => {
    if (!editingCategory || !editName.trim()) return;
    updateMutation.mutate({ id: editingCategory.id, name: editName.trim() });
  };

  const isComposer = phase === 'create' || phase === 'edit';

  return (
    <MasterAdminLayout>
      <div className="admin-posts-page master-admin-posts-hub">
        <header className="admin-page-header master-admin-posts-page__header" style={panelStyle}>
          <div className="master-admin-posts-page__header-row">
            <div>
              <h1 className="admin-page-title mb-1">Categories</h1>
              <p className="admin-page-subtitle mb-0">
                Create categories per school, or pick a school below to browse and edit existing ones.
              </p>
            </div>
            {!isComposer ? (
              <button type="button" className="admin-btn-primary" onClick={startCreate}>
                <i className="bi bi-plus-lg me-2" aria-hidden />
                Create category
              </button>
            ) : null}
          </div>
          {selectedSchool && phase === 'browse' ? (
            <p className="admin-form-hint mb-0 mt-2">
              Viewing: <strong>{selectedSchool.name}</strong>
            </p>
          ) : null}
          {composerSchool && phase === 'create' ? (
            <p className="admin-form-hint mb-0 mt-2">
              Creating for: <strong>{composerSchool.name}</strong>
            </p>
          ) : null}
        </header>

        {phase === 'browse' ? (
          <section className="admin-panel master-admin-posts-school-filter" style={panelStyle}>
            <div className="admin-panel__body">
              <label className="admin-form-label" htmlFor="ma-cat-filter-school">
                Select school
              </label>
              <select
                id="ma-cat-filter-school"
                className="form-select admin-form-control master-admin-posts-school-filter__select"
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  setFilterCategoryId('');
                }}
                disabled={schoolsLoading}
              >
                <option value="">Choose school…</option>
                {schoolOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {selectedSchoolId ? (
                <>
                  <label className="admin-form-label mt-3" htmlFor="ma-cat-filter-category">
                    Category
                  </label>
                  <select
                    id="ma-cat-filter-category"
                    className="form-select admin-form-control master-admin-posts-school-filter__select"
                    value={filterCategoryId}
                    onChange={(e) => setFilterCategoryId(e.target.value)}
                    disabled={isLoading || categories.length === 0}
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        {phase === 'create' ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__header d-flex justify-content-between align-items-center">
              <h2 className="admin-panel__title mb-0">New category</h2>
              <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={exitComposer}>
                Cancel
              </button>
            </div>
            <div className="admin-panel__body">
              <form className="admin-form" onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="admin-form-label" htmlFor="ma-create-cat-school">
                    Select school *
                  </label>
                  <select
                    id="ma-create-cat-school"
                    className="form-select admin-form-control master-admin-posts-school-filter__select"
                    value={composerSchoolId}
                    onChange={(e) => setComposerSchoolId(e.target.value)}
                    disabled={schoolsLoading}
                    required
                  >
                    <option value="">Choose school…</option>
                    {schoolOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="admin-form-hint mb-0 mt-1">Pick the school this category belongs to.</p>
                </div>
                <label className="admin-form-label" htmlFor="ma-new-cat-name">
                  Category name *
                </label>
                <input
                  id="ma-new-cat-name"
                  className="form-control admin-form-control master-admin-posts-school-filter__field mb-3"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  disabled={!composerSchoolId}
                />
                <label className="admin-form-label" htmlFor="ma-new-sub-draft">
                  Subcategories (optional)
                </label>
                <div className="master-admin-posts-school-filter__field d-flex gap-2 mb-2">
                  <input
                    id="ma-new-sub-draft"
                    className="form-control admin-form-control flex-grow-1"
                    value={newSubDraft}
                    onChange={(e) => setNewSubDraft(e.target.value)}
                    disabled={!composerSchoolId}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSubDraft.trim()) {
                          setCreateSubs((prev) => [...prev, newSubDraft.trim()]);
                          setNewSubDraft('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    disabled={!composerSchoolId}
                    onClick={() => {
                      if (newSubDraft.trim()) {
                        setCreateSubs((prev) => [...prev, newSubDraft.trim()]);
                        setNewSubDraft('');
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                {createSubs.length > 0 ? (
                  <div className="admin-pill-row master-admin-posts-school-filter__field mb-3">
                    {createSubs.map((sub, i) => (
                      <span key={`${sub}-${i}`} className="admin-pill admin-pill--neutral">
                        {sub}
                      </span>
                    ))}
                  </div>
                ) : null}
                <button
                  type="submit"
                  className="admin-btn-primary master-admin-posts-school-filter__field master-admin-posts-school-filter__field--btn"
                  disabled={createMutation.isPending || !composerSchoolId}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create category'}
                </button>
              </form>
              {createMutation.isError ? (
                <p className="admin-form-hint admin-form-hint--error mt-2 mb-0">
                  {mutationErrorMessage(createMutation.error, 'Failed to create category.')}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {phase === 'edit' && editingCategory ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__header d-flex justify-content-between align-items-center">
              <h2 className="admin-panel__title mb-0">Edit category</h2>
              <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={exitComposer}>
                Cancel
              </button>
            </div>
            <div className="admin-panel__body">
              <label className="admin-form-label" htmlFor="ma-edit-cat-name">
                Category name
              </label>
              <input
                id="ma-edit-cat-name"
                className="form-control admin-form-control mb-4"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <p className="admin-form-label mb-2">
                Subcategories ({editingCategory.subcategories.length})
              </p>
              {editingCategory.subcategories.length === 0 ? (
                <p className="admin-form-hint mb-3">No subcategories yet.</p>
              ) : (
                <ul className="list-unstyled mb-4">
                  {editingCategory.subcategories.map((sub: SubCategory) => (
                    <li key={sub.id} className="d-flex align-items-center gap-2 mb-2">
                      {editingSubCategoryId === sub.id ? (
                        <>
                          <input
                            className="form-control admin-form-control"
                            value={editSubName}
                            onChange={(e) => setEditSubName(e.target.value)}
                          />
                          <button
                            type="button"
                            className="admin-btn-primary admin-btn-sm"
                            disabled={updateSubMutation.isPending}
                            onClick={() => updateSubMutation.mutate({ id: sub.id, name: editSubName.trim() })}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="admin-btn-secondary admin-btn-sm"
                            onClick={() => setEditingSubCategoryId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="admin-table__strong flex-grow-1">{sub.name}</span>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-btn--edit"
                            title="Edit subcategory"
                            onClick={() => {
                              setEditingSubCategoryId(sub.id);
                              setEditSubName(sub.name);
                            }}
                          >
                            <i className="bi bi-pencil" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-btn--danger"
                            title="Delete subcategory"
                            onClick={() => {
                              if (window.confirm(`Delete subcategory "${sub.name}"?`)) {
                                deleteSubMutation.mutate(sub.id);
                              }
                            }}
                          >
                            <i className="bi bi-trash" aria-hidden />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="d-flex flex-wrap gap-2 justify-content-between">
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={() => handleRequestDeleteCategory(editingCategory)}
                >
                  Delete category
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={updateMutation.isPending}
                  onClick={handleSaveCategory}
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {selectedSchoolId && phase === 'browse' ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              {isLoading ? (
                <p className="master-admin-detail-muted mb-0">Loading categories…</p>
              ) : isError ? (
                <p className="master-admin-detail-muted mb-0">Could not load categories.</p>
              ) : visibleCategories.length === 0 ? (
                <p className="master-admin-detail-muted mb-0">
                  {categories.length === 0
                    ? 'No categories for this school yet. Use Create category to add one.'
                    : 'No category matches your selection.'}
                </p>
              ) : (
                <div className="admin-table-wrap master-admin-school-table-wrap master-admin-school-table-wrap--posts">
                  <table className="admin-table master-admin-school-table master-admin-posts-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Subcategories</th>
                        <th className="text-end master-admin-posts-table__col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCategories.map((cat) => (
                        <tr key={cat.id}>
                          <td>
                            <span className="admin-table__strong">{cat.name}</span>
                          </td>
                          <td>
                            {cat.subcategories.length === 0 ? (
                              <span className="admin-form-hint">None</span>
                            ) : (
                              <span>{cat.subcategories.map((s) => s.name).join(', ')}</span>
                            )}
                          </td>
                          <td className="text-end master-admin-posts-table__col-actions">
                            <div className="admin-table-actions justify-content-end">
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn--edit"
                                title={`Edit ${cat.name}`}
                                aria-label={`Edit ${cat.name}`}
                                onClick={() => startEdit(cat)}
                              >
                                <i className="bi bi-pencil" aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn--danger"
                                title={`Delete ${cat.name}`}
                                aria-label={`Delete ${cat.name}`}
                                onClick={() => handleRequestDeleteCategory(cat)}
                              >
                                <i className="bi bi-trash" aria-hidden />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {phase === 'browse' && !selectedSchoolId ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <p className="master-admin-detail-muted mb-0">
                Select a school to see its categories, or click <strong>Create category</strong> to add a new one.
              </p>
            </div>
          </section>
        ) : null}

        {deleteModal ? (
          <div
            className="admin-modal-overlay admin-modal-overlay--elevated"
            role="presentation"
            onClick={() => setDeleteModal(null)}
          >
            <div
              className="admin-modal"
              role="dialog"
              aria-labelledby="ma-delete-category-title"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal__body">
                <div className="admin-modal__head">
                  <i
                    className={`bi ${
                      deleteModal.mode === 'blocked' ? 'bi-diagram-3' : 'bi-exclamation-triangle'
                    } admin-modal__icon${
                      deleteModal.mode === 'confirm' ? ' admin-modal__icon--error' : ''
                    }`}
                    aria-hidden
                  />
                  <h2 id="ma-delete-category-title" className="admin-modal__title">
                    {deleteModal.mode === 'blocked' ? 'Cannot delete category' : 'Delete category?'}
                  </h2>
                </div>
                {deleteModal.mode === 'blocked' ? (
                  <>
                    <p className="admin-modal__text">
                      <strong>{deleteModal.category.name}</strong> is associated with{' '}
                      {deleteModal.category.subcategories.length} subcategor
                      {deleteModal.category.subcategories.length === 1 ? 'y' : 'ies'}. Delete all
                      subcategories first, then you can delete this category.
                    </p>
                    <ul className="admin-form-hint mb-0 ps-3">
                      {deleteModal.category.subcategories.map((sub) => (
                        <li key={sub.id}>{sub.name}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="admin-modal__text mb-0">
                    Delete <strong>{deleteModal.category.name}</strong>? This cannot be undone.
                  </p>
                )}
                <div className="admin-modal__footer">
                  <button type="button" className="admin-btn-secondary" onClick={() => setDeleteModal(null)}>
                    {deleteModal.mode === 'blocked' ? 'Close' : 'Cancel'}
                  </button>
                  {deleteModal.mode === 'blocked' ? (
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => {
                        const cat = deleteModal.category;
                        setDeleteModal(null);
                        startEdit(cat);
                      }}
                    >
                      Edit & remove subcategories
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn-danger"
                      disabled={deleteMutation.isPending}
                      onClick={handleConfirmDeleteCategory}
                    >
                      {deleteMutation.isPending ? 'Deleting…' : 'Delete category'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MasterAdminLayout>
  );
}
