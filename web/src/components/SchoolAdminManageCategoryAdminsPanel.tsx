import { useState, type CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { categoriesService, type Category } from '../services/categories.service';
import {
  categoryAdminsService,
  type CreateCategoryAdminDto,
  type CategoryAdmin,
  type UpdateCategoryAdminCategoriesDto,
} from '../services/category-admins.service';

function mutationErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function categoryLabelsForAdmin(admin: CategoryAdmin): { id: string; name: string }[] {
  const items: { id: string; name: string }[] = [];
  if (admin.category?.id && admin.category?.name) {
    items.push({ id: admin.category.id, name: admin.category.name });
  }
  admin.categories?.forEach((c) => {
    if (c.category?.id && c.category?.name && !items.some((i) => i.id === c.category.id)) {
      items.push({ id: c.category.id, name: c.category.name });
    }
  });
  return items;
}

export function SchoolAdminManageCategoryAdminsPanel({ panelStyle }: { panelStyle: CSSProperties }) {
  const queryClient = useQueryClient();
  const { user } = useSchoolAdminAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryAdminDto>({
    name: '',
    email: '',
    categoryId: '',
  });
  const [emailError, setEmailError] = useState('');
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    categoryAdmin: CategoryAdmin | null;
    tempPassword: string;
    emailSent: boolean;
    emailError?: string | null;
  }>({
    isOpen: false,
    categoryAdmin: null,
    tempPassword: '',
    emailSent: false,
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    categoryAdmin: CategoryAdmin | null;
  }>({
    isOpen: false,
    categoryAdmin: null,
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    categoryAdmin: CategoryAdmin | null;
    selectedCategoryIds: string[];
  }>({
    isOpen: false,
    categoryAdmin: null,
    selectedCategoryIds: [],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  });

  const { data: categoryAdmins, isLoading: adminsLoading } = useQuery<CategoryAdmin[]>({
    queryKey: ['category-admins'],
    queryFn: categoryAdminsService.getAll,
  });

  const schoolDomain =
    user?.schoolDomain || (categoryAdmins && categoryAdmins.length > 0 ? categoryAdmins[0].school.domain : null);

  const createCategoryAdminMutation = useMutation({
    mutationFn: categoryAdminsService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-admins'] });
      setIsCreating(false);
      setFormData({ name: '', email: '', categoryId: '' });
      setEmailError('');
      setSuccessModal({
        isOpen: true,
        categoryAdmin: data,
        tempPassword: data.tempPassword,
        emailSent: data.emailSent,
        emailError: data.emailError,
      });
    },
  });

  const deleteCategoryAdminMutation = useMutation({
    mutationFn: categoryAdminsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-admins'] });
      setDeleteModal({ isOpen: false, categoryAdmin: null });
    },
  });

  const updateCategoryAdminCategoriesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryAdminCategoriesDto }) =>
      categoryAdminsService.updateCategories(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-admins'] });
      setEditModal({ isOpen: false, categoryAdmin: null, selectedCategoryIds: [] });
    },
  });

  const validateDomain = (email: string): boolean => {
    if (!schoolDomain) {
      setEmailError('School domain is not set. Please contact super admin.');
      return false;
    }
    const emailDomain = email.split('@')[1];
    if (!emailDomain) {
      setEmailError('Invalid email format');
      return false;
    }
    if (emailDomain.toLowerCase() !== schoolDomain.toLowerCase()) {
      setEmailError(`Email domain must match school domain: ${schoolDomain}`);
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    if (email && !email.includes('@')) {
      setEmailError('Please enter a valid email address');
    } else if (email) {
      validateDomain(email);
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter category admin name');
      return;
    }
    if (!formData.email.trim()) {
      alert('Please enter category admin email');
      return;
    }
    if (!validateDomain(formData.email)) return;
    if (!formData.categoryId) {
      alert('Please select a category');
      return;
    }
    createCategoryAdminMutation.mutate(formData);
  };

  const handleEditClick = (categoryAdmin: CategoryAdmin) => {
    const currentCategoryIds = categoryAdmin.categories
      ? categoryAdmin.categories.map((c) => c.category.id)
      : [categoryAdmin.categoryId];
    setEditModal({
      isOpen: true,
      categoryAdmin,
      selectedCategoryIds: currentCategoryIds,
    });
  };

  const handleEditCategoryToggle = (categoryId: string) => {
    setEditModal((prev) => {
      const isSelected = prev.selectedCategoryIds.includes(categoryId);
      return {
        ...prev,
        selectedCategoryIds: isSelected
          ? prev.selectedCategoryIds.filter((id) => id !== categoryId)
          : [...prev.selectedCategoryIds, categoryId],
      };
    });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ isOpen: false, categoryAdmin: null, tempPassword: '', emailSent: false });
  };

  return (
    <>
      <div className="d-flex justify-content-end mb-4">
        <button type="button" className="admin-btn-primary" onClick={() => setIsCreating(true)}>
          <i className="bi bi-person-plus me-2" aria-hidden />
          Add category admin
        </button>
      </div>

      {isCreating ? (
        <section className="admin-panel admin-panel--nested mb-4" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">New category admin</h2>
            <button
              type="button"
              className="admin-btn-secondary admin-btn-sm"
              onClick={() => {
                setIsCreating(false);
                setFormData({ name: '', email: '', categoryId: '' });
                setEmailError('');
              }}
            >
              Cancel
            </button>
          </div>
          <div className="admin-panel__body">
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="ca-name">
                    Name *
                  </label>
                  <input
                    id="ca-name"
                    type="text"
                    className="form-control admin-form-control"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="ca-email">
                    Email *
                  </label>
                  <input
                    id="ca-email"
                    type="email"
                    className={`form-control admin-form-control${emailError ? ' is-invalid' : ''}`}
                    required
                    value={formData.email}
                    onChange={handleEmailChange}
                    placeholder={`admin@${schoolDomain || 'school.edu'}`}
                  />
                  {emailError ? (
                    <p className="admin-form-hint admin-form-hint--error">{emailError}</p>
                  ) : schoolDomain && formData.email ? (
                    <p className="admin-form-hint mb-0">Must use domain: {schoolDomain}</p>
                  ) : null}
                </div>
                <div className="col-12">
                  <label className="admin-form-label" htmlFor="ca-category">
                    Initial category *
                  </label>
                  <select
                    id="ca-category"
                    className="form-select admin-form-control"
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categoriesLoading ? <p className="admin-form-hint mb-0">Loading categories…</p> : null}
                </div>
              </div>
              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={createCategoryAdminMutation.isPending || !!emailError}
                >
                  {createCategoryAdminMutation.isPending ? 'Creating…' : 'Create category admin'}
                </button>
              </div>
            </form>
            {createCategoryAdminMutation.isError ? (
              <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">
                {mutationErrorMessage(createCategoryAdminMutation.error, 'Failed to create category admin.')}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Category admins</h2>
        </div>
        <div className="admin-panel__body">
          <div className="admin-form-callout mb-4">
            <i className="bi bi-info-circle me-2" aria-hidden />
            To give an existing admin access to more categories, use <strong>Add categories</strong> — no new
            email or login required.
          </div>

          {adminsLoading ? (
            <div className="admin-loading-state">Loading category admins…</div>
          ) : categoryAdmins && categoryAdmins.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Categories</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryAdmins.map((admin) => {
                    const labels = categoryLabelsForAdmin(admin);
                    return (
                      <tr key={admin.id}>
                        <td className="admin-table__strong">{admin.name}</td>
                        <td>{admin.email}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {labels.map((item) => (
                              <span key={item.id} className="admin-pill admin-pill--active">
                                {item.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span
                            className={
                              admin.isActive ? 'admin-pill admin-pill--active' : 'admin-pill admin-pill--inactive'
                            }
                          >
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-table-actions justify-content-end">
                            <button
                              type="button"
                              className="admin-btn-secondary admin-btn-sm"
                              onClick={() => handleEditClick(admin)}
                            >
                              <i className="bi bi-plus-circle me-1" aria-hidden />
                              Add categories
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--danger"
                              title="Delete admin"
                              disabled={deleteCategoryAdminMutation.isPending}
                              onClick={() => setDeleteModal({ isOpen: true, categoryAdmin: admin })}
                            >
                              <i className="bi bi-trash" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty-state">
              <p className="mb-3">No category admins yet.</p>
              <button type="button" className="admin-btn-primary" onClick={() => setIsCreating(true)}>
                Create your first category admin
              </button>
            </div>
          )}

          {deleteCategoryAdminMutation.isError ? (
            <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">
              {mutationErrorMessage(deleteCategoryAdminMutation.error, 'Failed to delete category admin.')}
            </p>
          ) : null}
        </div>
      </section>

      {successModal.isOpen && successModal.categoryAdmin ? (
        <div className="admin-modal-overlay" role="presentation" onClick={closeSuccessModal}>
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="ca-success-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body admin-modal__body--with-close">
              <button type="button" className="admin-modal__close" aria-label="Close" onClick={closeSuccessModal}>
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <div className="admin-modal__head">
                <i className="bi bi-check-circle admin-modal__icon admin-modal__icon--success" aria-hidden />
                <h2 id="ca-success-title" className="admin-modal__title">
                  Category admin created
                </h2>
              </div>
              <div className="admin-credential-box">
                <div className="admin-credential-field">
                  <strong>Name</strong>
                  <div className="admin-credential-value">{successModal.categoryAdmin.name}</div>
                </div>
                <div className="admin-credential-field">
                  <strong>Email</strong>
                  <div className="admin-credential-value">{successModal.categoryAdmin.email}</div>
                </div>
                <div className="admin-credential-field">
                  <strong>Temporary password</strong>
                  <div className="admin-credential-value admin-credential-value--secret">
                    {successModal.tempPassword}
                  </div>
                </div>
                <div className="admin-credential-field">
                  <strong>Category</strong>
                  <div className="admin-credential-value">{successModal.categoryAdmin.category.name}</div>
                </div>
              </div>
              {successModal.emailSent ? (
                <p className="admin-form-hint mb-0">
                  <i className="bi bi-envelope-check me-1" aria-hidden />
                  Email sent to {successModal.categoryAdmin.email}
                </p>
              ) : (
                <p className="admin-form-hint admin-form-hint--error mb-0">
                  Email could not be sent
                  {successModal.emailError ? ` (${successModal.emailError})` : ''}. Share credentials manually.
                </p>
              )}
              <div className="admin-modal__footer mt-4">
                <button type="button" className="admin-btn-primary" onClick={closeSuccessModal}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editModal.isOpen && editModal.categoryAdmin ? (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setEditModal({ isOpen: false, categoryAdmin: null, selectedCategoryIds: [] })}
        >
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="ca-edit-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <h2 id="ca-edit-title" className="admin-modal__title mb-2">
                Category access — {editModal.categoryAdmin.name}
              </h2>
              <p className="admin-modal__text">
                Select all categories this admin should manage. No new login is required.
              </p>
              <p className="admin-form-label mb-2">Current</p>
              <div className="admin-pill-row mb-3">
                {categoryLabelsForAdmin(editModal.categoryAdmin).map((item) => (
                  <span key={item.id} className="admin-pill admin-pill--neutral">
                    {item.name}
                  </span>
                ))}
              </div>
              <div className="admin-subcategory-stack mb-3">
                {categories?.map((category) => (
                  <label key={category.id} className="admin-form-radio d-flex align-items-center gap-2 mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input mt-0"
                      checked={editModal.selectedCategoryIds.includes(category.id)}
                      onChange={() => handleEditCategoryToggle(category.id)}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
              {editModal.selectedCategoryIds.length === 0 ? (
                <p className="admin-form-hint admin-form-hint--error">Select at least one category.</p>
              ) : null}
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setEditModal({ isOpen: false, categoryAdmin: null, selectedCategoryIds: [] })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={
                    updateCategoryAdminCategoriesMutation.isPending ||
                    editModal.selectedCategoryIds.length === 0
                  }
                  onClick={() => {
                    if (editModal.categoryAdmin && editModal.selectedCategoryIds.length > 0) {
                      updateCategoryAdminCategoriesMutation.mutate({
                        id: editModal.categoryAdmin.id,
                        data: { categoryIds: editModal.selectedCategoryIds },
                      });
                    }
                  }}
                >
                  {updateCategoryAdminCategoriesMutation.isPending ? 'Saving…' : 'Save access'}
                </button>
              </div>
              {updateCategoryAdminCategoriesMutation.isError ? (
                <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">
                  {mutationErrorMessage(updateCategoryAdminCategoriesMutation.error, 'Failed to update categories.')}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {deleteModal.isOpen && deleteModal.categoryAdmin ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={() => setDeleteModal({ isOpen: false, categoryAdmin: null })}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-labelledby="ca-delete-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <i className="bi bi-exclamation-triangle admin-modal__icon admin-modal__icon--error" aria-hidden />
                <h2 id="ca-delete-title" className="admin-modal__title">
                  Delete category admin?
                </h2>
              </div>
              <p className="admin-modal__text">
                Remove <strong>{deleteModal.categoryAdmin.name}</strong> ({deleteModal.categoryAdmin.email})? This
                cannot be undone.
              </p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setDeleteModal({ isOpen: false, categoryAdmin: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  disabled={deleteCategoryAdminMutation.isPending}
                  onClick={() => {
                    if (deleteModal.categoryAdmin) {
                      deleteCategoryAdminMutation.mutate(deleteModal.categoryAdmin.id);
                    }
                  }}
                >
                  {deleteCategoryAdminMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
