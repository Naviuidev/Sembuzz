import { useState, useEffect, type CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SchoolAdminLayout } from '../components/SchoolAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  categoriesService,
  type Category,
  type SubCategory,
  type CreateCategoryDto,
  type CreateSubCategoryDto,
  type UpdateCategoryDto,
  type UpdateSubCategoryDto,
} from '../services/categories.service';

function mutationErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function CategoryPickerCard({
  category,
  showTooltip,
  onHover,
  onLeave,
  onClick,
}: {
  category: Category;
  showTooltip: boolean;
  onHover: (id: string) => void;
  onLeave: () => void;
  onClick: (category: Category) => void;
}) {
  const count = category.subcategories.length;
  const meta = `${count} subcategor${count === 1 ? 'y' : 'ies'}`;

  return (
    <div
      className="admin-picker-card-wrap"
      onMouseEnter={() => onHover(category.id)}
      onMouseLeave={onLeave}
    >
      <button type="button" className="admin-picker-card" onClick={() => onClick(category)}>
        <p className="admin-picker-card__title">{category.name}</p>
        <p className="admin-picker-card__meta">{meta}</p>
      </button>
      {showTooltip ? (
        <div className="admin-school-tooltip" role="tooltip">
          <p className="admin-school-tooltip__title">{category.name}</p>
          <p className="admin-school-tooltip__body">
            {count === 0 ? (
              'No subcategories yet. Click to add or edit.'
            ) : (
              <>
                <strong style={{ color: '#334155' }}>Subcategories: </strong>
                {category.subcategories.map((sub, index) => (
                  <span key={sub.id}>
                    {sub.name}
                    {index < count - 1 ? ', ' : ''}
                  </span>
                ))}
              </>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export const SchoolAdminCategories = () => {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.school } as CSSProperties;
  const queryClient = useQueryClient();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingSubCategory, setIsCreatingSubCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'subcategory';
    item: Category | SubCategory | null;
    categoryName?: string;
  }>({
    isOpen: false,
    type: 'category',
    item: null,
  });

  const [categoryFormData, setCategoryFormData] = useState<CreateCategoryDto>({
    name: '',
    subcategories: [],
  });
  const [subCategoryFormData, setSubCategoryFormData] = useState<CreateSubCategoryDto>({
    name: '',
    categoryId: '',
  });
  const [editCategoryData, setEditCategoryData] = useState<UpdateCategoryDto>({
    name: '',
  });
  const [editSubCategoryData, setEditSubCategoryData] = useState<UpdateSubCategoryDto>({
    name: '',
  });
  const [newSubCategoryName, setNewSubCategoryName] = useState('');

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  });

  // Filter categories based on search query
  const filteredCategories =
    categories?.filter(
      (category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.subcategories.some((sub) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

  // Update selectedCategory when categories data changes
  useEffect(() => {
    if (selectedCategory && categories) {
      const updated = categories.find((c) => c.id === selectedCategory.id);
      if (updated) {
        setSelectedCategory(updated);
      }
    }
  }, [categories, selectedCategory]);

  const createCategoryMutation = useMutation({
    mutationFn: async (payload: CreateCategoryDto | { names: string[]; subcategories?: string[] }) => {
      if ('names' in payload && Array.isArray(payload.names)) {
        for (const name of payload.names) {
          await categoriesService.create({
            name: name.trim(),
            subcategories: payload.subcategories,
          });
        }
        return;
      }
      return categoriesService.create(payload as CreateCategoryDto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreatingCategory(false);
      setCategoryFormData({ name: '', subcategories: [] });
      setNewSubCategoryName('');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedCategory(null);
      setEditCategoryData({ name: '' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteModal({ isOpen: false, type: 'category', item: null });
      setSelectedCategory(null);
    },
  });

  const createSubCategoryMutation = useMutation({
    mutationFn: categoriesService.createSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreatingSubCategory(false);
      setSubCategoryFormData({ name: '', categoryId: '' });
    },
  });

  const updateSubCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubCategoryDto }) =>
      categoriesService.updateSubCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingSubCategoryId(null);
      setEditSubCategoryData({ name: '' });
      // Refresh selected category to show updated subcategories
      if (selectedCategory) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }
    },
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: categoriesService.deleteSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteModal({ isOpen: false, type: 'subcategory', item: null });
    },
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryFormData.name.trim();
    if (!trimmed) {
      alert('Please enter a category name');
      return;
    }
    const names = trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) {
      alert('Please enter at least one category name');
      return;
    }
    if (names.length === 1) {
      createCategoryMutation.mutate({
        name: names[0],
        subcategories: categoryFormData.subcategories,
      });
    } else {
      createCategoryMutation.mutate({
        names,
        subcategories: categoryFormData.subcategories,
      });
    }
  };

  const handleAddSubCategoryToForm = () => {
    if (newSubCategoryName.trim()) {
      setCategoryFormData({
        ...categoryFormData,
        subcategories: [...(categoryFormData.subcategories || []), newSubCategoryName.trim()],
      });
      setNewSubCategoryName('');
    }
  };

  const handleRemoveSubCategoryFromForm = (index: number) => {
    setCategoryFormData({
      ...categoryFormData,
      subcategories: categoryFormData.subcategories?.filter((_, i) => i !== index) || [],
    });
  };

  const handleCreateSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCategoryFormData.name.trim() || !subCategoryFormData.categoryId) {
      alert('Please fill in all fields');
      return;
    }
    createSubCategoryMutation.mutate(subCategoryFormData);
  };

  const handleCategoryCardClick = (category: Category) => {
    setSelectedCategory(category);
    setEditCategoryData({ name: category.name });
  };

  const handleUpdateCategory = (id: string) => {
    if (!editCategoryData.name?.trim()) {
      alert('Please enter a category name');
      return;
    }
    updateCategoryMutation.mutate({ id, data: editCategoryData });
  };

  const handleEditSubCategory = (subCategory: SubCategory) => {
    setEditingSubCategoryId(subCategory.id);
    setEditSubCategoryData({ name: subCategory.name });
  };

  const handleCloseEditScreen = () => {
    setSelectedCategory(null);
    setEditingSubCategoryId(null);
    setEditCategoryData({ name: '' });
    setEditSubCategoryData({ name: '' });
  };

  const handleUpdateSubCategory = (id: string) => {
    if (!editSubCategoryData.name?.trim()) {
      alert('Please enter a subcategory name');
      return;
    }
    updateSubCategoryMutation.mutate({ id, data: editSubCategoryData });
  };

  const handleDeleteClick = (type: 'category' | 'subcategory', item: Category | SubCategory, categoryName?: string) => {
    setDeleteModal({ isOpen: true, type, item, categoryName });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.item) {
      if (deleteModal.type === 'category') {
        deleteCategoryMutation.mutate(deleteModal.item.id);
      } else {
        deleteSubCategoryMutation.mutate(deleteModal.item.id);
      }
    }
  };

  const cancelEdit = () => {
    setEditingSubCategoryId(null);
    setEditSubCategoryData({ name: '' });
  };

  return (
    <SchoolAdminLayout>
      <header className="admin-page-header admin-page-header--toolbar" style={panelStyle}>
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <p className="admin-page-subtitle">
            Organize posts and admins with categories and subcategories for your school.
          </p>
        </div>
        <div className="admin-page-toolbar__actions">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => {
              setIsCreatingSubCategory(true);
              setIsCreatingCategory(false);
            }}
          >
            <i className="bi bi-diagram-3 me-2" aria-hidden />
            Add subcategory
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => {
              setIsCreatingCategory(true);
              setIsCreatingSubCategory(false);
            }}
          >
            <i className="bi bi-plus-circle me-2" aria-hidden />
            Add category
          </button>
        </div>
      </header>

      {isCreatingCategory ? (
        <section className="admin-panel admin-panel--nested mb-4" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">New category</h2>
            <button
              type="button"
              className="admin-btn-secondary admin-btn-sm"
              onClick={() => {
                setIsCreatingCategory(false);
                setCategoryFormData({ name: '', subcategories: [] });
                setNewSubCategoryName('');
              }}
            >
              Cancel
            </button>
          </div>
          <div className="admin-panel__body">
            <form className="admin-form" onSubmit={handleCreateCategory}>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="new-category-name">
                  Category name *
                </label>
                <input
                  id="new-category-name"
                  type="text"
                  className="form-control admin-form-control"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Academics, Sports — or c1, c2, c3 for multiple"
                />
                <p className="admin-form-hint">Separate multiple names with commas to create several at once.</p>
              </div>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="new-subcategory-draft">
                  Subcategories (optional)
                </label>
                <div className="d-flex flex-wrap gap-2">
                  <input
                    id="new-subcategory-draft"
                    type="text"
                    className="form-control admin-form-control flex-grow-1"
                    value={newSubCategoryName}
                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubCategoryToForm();
                      }
                    }}
                    placeholder="Add a subcategory name"
                  />
                  <button type="button" className="admin-btn-secondary" onClick={handleAddSubCategoryToForm}>
                    Add
                  </button>
                </div>
                {categoryFormData.subcategories && categoryFormData.subcategories.length > 0 ? (
                  <div className="admin-pill-row">
                    {categoryFormData.subcategories.map((sub, index) => (
                      <span key={`${sub}-${index}`} className="admin-pill admin-pill--removable">
                        {sub}
                        <button
                          type="button"
                          className="admin-pill-remove"
                          aria-label={`Remove ${sub}`}
                          onClick={() => handleRemoveSubCategoryFromForm(index)}
                        >
                          <i className="bi bi-x-lg" aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="admin-form-hint mb-0">You can add more subcategories later when editing a category.</p>
              </div>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn-primary" disabled={createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending ? 'Creating…' : 'Create category'}
                </button>
              </div>
            </form>
            {createCategoryMutation.isError ? (
              <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">
                {mutationErrorMessage(createCategoryMutation.error, 'Failed to create category. Please try again.')}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {isCreatingSubCategory ? (
        <section className="admin-panel admin-panel--nested mb-4" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">New subcategory</h2>
            <button
              type="button"
              className="admin-btn-secondary admin-btn-sm"
              onClick={() => {
                setIsCreatingSubCategory(false);
                setSubCategoryFormData({ name: '', categoryId: '' });
              }}
            >
              Cancel
            </button>
          </div>
          <div className="admin-panel__body">
            <form className="admin-form" onSubmit={handleCreateSubCategory}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="subcategory-parent">
                    Parent category *
                  </label>
                  <select
                    id="subcategory-parent"
                    className="form-select admin-form-control"
                    required
                    value={subCategoryFormData.categoryId}
                    onChange={(e) =>
                      setSubCategoryFormData({ ...subCategoryFormData, categoryId: e.target.value })
                    }
                  >
                    <option value="">Select a category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="subcategory-name">
                    Subcategory name *
                  </label>
                  <input
                    id="subcategory-name"
                    type="text"
                    className="form-control admin-form-control"
                    required
                    value={subCategoryFormData.name}
                    onChange={(e) =>
                      setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value })
                    }
                    placeholder="e.g. Mathematics, Football"
                  />
                </div>
              </div>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn-primary" disabled={createSubCategoryMutation.isPending}>
                  {createSubCategoryMutation.isPending ? 'Creating…' : 'Create subcategory'}
                </button>
              </div>
            </form>
            {createSubCategoryMutation.isError ? (
              <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">
                {mutationErrorMessage(createSubCategoryMutation.error, 'Failed to create subcategory. Please try again.')}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__header">
          <div className="admin-search-wrap admin-search-wrap--wide">
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              type="search"
              className="form-control admin-search-input"
              placeholder="Search categories or subcategories"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search categories"
            />
          </div>
          {!isLoading && categories ? (
            <span className="admin-pill admin-pill--neutral">
              {filteredCategories.length} of {categories.length} shown
            </span>
          ) : null}
        </div>
        <div className="admin-panel__body">
          {isLoading ? (
            <div className="admin-loading-state">
              <div className="spinner-border spinner-border-sm text-secondary mb-2" role="status" />
              <p className="mb-0">Loading categories…</p>
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="admin-category-grid">
              {filteredCategories.map((category) => (
                <CategoryPickerCard
                  key={category.id}
                  category={category}
                  showTooltip={hoveredCategoryId === category.id}
                  onHover={setHoveredCategoryId}
                  onLeave={() => setHoveredCategoryId(null)}
                  onClick={handleCategoryCardClick}
                />
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <i className="bi bi-folder2-open d-block mb-3" style={{ fontSize: '2.5rem', color: '#94a3b8' }} aria-hidden />
              <p className="mb-1">
                {searchQuery ? 'No categories match your search.' : 'No categories yet.'}
              </p>
              {!searchQuery ? (
                <p className="admin-form-hint mb-3">
                  Categories group content and permissions. Add your first category to get started.
                </p>
              ) : null}
              {!searchQuery ? (
                <button type="button" className="admin-btn-primary" onClick={() => setIsCreatingCategory(true)}>
                  <i className="bi bi-plus-circle me-2" aria-hidden />
                  Create your first category
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {deleteModal.isOpen && deleteModal.item ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={() => {
            setDeleteModal({ isOpen: false, type: 'category', item: null });
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-labelledby="delete-category-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <i className="bi bi-exclamation-triangle admin-modal__icon admin-modal__icon--error" aria-hidden />
                <h2 id="delete-category-title" className="admin-modal__title">
                  Confirm delete
                </h2>
              </div>
              <p className="admin-modal__text">
                Delete <strong>{deleteModal.item.name}</strong>
                {deleteModal.type === 'subcategory' && deleteModal.categoryName ? (
                  <> under {deleteModal.categoryName}</>
                ) : null}
                ? This cannot be undone.
                {deleteModal.type === 'category' ? ' All subcategories will be removed too.' : null}
              </p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setDeleteModal({ isOpen: false, type: 'category', item: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  disabled={deleteCategoryMutation.isPending || deleteSubCategoryMutation.isPending}
                  onClick={handleDeleteConfirm}
                >
                  {deleteCategoryMutation.isPending || deleteSubCategoryMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedCategory && !deleteModal.isOpen ? (
        <div className="admin-modal-overlay" role="presentation" onClick={handleCloseEditScreen}>
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="edit-category-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body admin-modal__body--with-close">
              <button type="button" className="admin-modal__close" aria-label="Close" onClick={handleCloseEditScreen}>
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <h2 id="edit-category-title" className="admin-modal__title mb-3">
                Edit category
              </h2>
              <label className="admin-form-label" htmlFor="edit-category-name">
                Category name *
              </label>
              <input
                id="edit-category-name"
                type="text"
                className="form-control admin-form-control mb-4"
                value={editCategoryData.name || ''}
                onChange={(e) => setEditCategoryData({ name: e.target.value })}
              />
              <p className="admin-form-label mb-2">
                Subcategories ({selectedCategory.subcategories.length})
              </p>
              {selectedCategory.subcategories.length > 0 ? (
                <div className="admin-subcategory-stack mb-4">
                  {selectedCategory.subcategories.map((subCategory) => (
                    <div key={subCategory.id} className="admin-subcategory-row">
                      {editingSubCategoryId === subCategory.id ? (
                        <div className="admin-form-inline">
                          <input
                            type="text"
                            className="form-control admin-form-control"
                            value={editSubCategoryData.name || ''}
                            onChange={(e) => setEditSubCategoryData({ name: e.target.value })}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="admin-btn-primary admin-btn-sm"
                            disabled={updateSubCategoryMutation.isPending}
                            onClick={() => handleUpdateSubCategory(subCategory.id)}
                          >
                            {updateSubCategoryMutation.isPending ? 'Saving…' : 'Save'}
                          </button>
                          <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="admin-subcategory-row__name">{subCategory.name}</span>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-icon-btn"
                              title="Edit subcategory"
                              onClick={() => handleEditSubCategory(subCategory)}
                            >
                              <i className="bi bi-pencil" aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--danger"
                              title="Delete subcategory"
                              disabled={deleteSubCategoryMutation.isPending}
                              onClick={() =>
                                handleDeleteClick('subcategory', subCategory, selectedCategory.name)
                              }
                            >
                              <i className="bi bi-trash" aria-hidden />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-form-hint mb-4">No subcategories yet. Use “Add subcategory” from the main page.</p>
              )}
              <div className="admin-modal__footer admin-modal__footer--between pt-3 border-top">
                <button
                  type="button"
                  className="admin-btn-danger"
                  disabled={deleteCategoryMutation.isPending}
                  onClick={() => handleDeleteClick('category', selectedCategory)}
                >
                  {deleteCategoryMutation.isPending ? 'Deleting…' : 'Delete category'}
                </button>
                <div className="admin-form-actions__group">
                  <button type="button" className="admin-btn-secondary" onClick={handleCloseEditScreen}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={updateCategoryMutation.isPending}
                    onClick={() => handleUpdateCategory(selectedCategory.id)}
                  >
                    {updateCategoryMutation.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SchoolAdminLayout>
  );
};
