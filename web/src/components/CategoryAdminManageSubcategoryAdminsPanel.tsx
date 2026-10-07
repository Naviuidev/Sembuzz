import { useState, type CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { categoryAdminCategoriesService } from '../services/category-admin-categories.service';
import {
  subCategoryAdminsService,
  type CreateSubCategoryAdminDto,
  type SubCategoryAdmin,
  type UpdateSubCategoryAdminSubCategoriesDto,
} from '../services/subcategory-admins.service';

function mutationErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function subcategoryLabelsForAdmin(admin: SubCategoryAdmin): { id: string; name: string }[] {
  const items: { id: string; name: string }[] = [];
  if (admin.subCategory?.id && admin.subCategory?.name) {
    items.push({ id: admin.subCategory.id, name: admin.subCategory.name });
  }
  admin.subCategories?.forEach((s) => {
    if (s.subCategory?.id && s.subCategory?.name && !items.some((i) => i.id === s.subCategory.id)) {
      items.push({ id: s.subCategory.id, name: s.subCategory.name });
    }
  });
  return items;
}

export function CategoryAdminManageSubcategoryAdminsPanel({ panelStyle }: { panelStyle: CSSProperties }) {
  const queryClient = useQueryClient();
  const { user, token } = useCategoryAdminAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateSubCategoryAdminDto>({
    name: '',
    email: '',
    subCategoryId: '',
  });
  const [emailError, setEmailError] = useState('');
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    subCategoryAdmin: SubCategoryAdmin | null;
    tempPassword: string;
    emailSent: boolean;
    emailError?: string | null;
  }>({
    isOpen: false,
    subCategoryAdmin: null,
    tempPassword: '',
    emailSent: false,
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    subCategoryAdmin: SubCategoryAdmin | null;
  }>({
    isOpen: false,
    subCategoryAdmin: null,
  });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    subCategoryAdmin: SubCategoryAdmin | null;
    selectedSubCategoryIds: string[];
  }>({
    isOpen: false,
    subCategoryAdmin: null,
    selectedSubCategoryIds: [],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['category-admin-categories'],
    queryFn: categoryAdminCategoriesService.getMyCategories,
    enabled: !!token,
  });

  const allSubcategories = (categories ?? []).flatMap((cat) =>
    (cat.subcategories ?? []).map((sc) => ({ ...sc, categoryName: cat.name })),
  );

  const { data: subCategoryAdmins, isLoading: adminsLoading, error: adminsError } = useQuery<SubCategoryAdmin[]>({
    queryKey: ['category-admin', 'subcategory-admins', user?.id],
    queryFn: () => subCategoryAdminsService.getAll(),
    enabled: !!token,
  });

  const category = categories?.[0];
  const schoolDomain =
    user?.schoolDomain ||
    category?.school?.domain ||
    (subCategoryAdmins && subCategoryAdmins.length > 0 ? subCategoryAdmins[0].school.domain : null);

  const createSubCategoryAdminMutation = useMutation({
    mutationFn: (data: CreateSubCategoryAdminDto) => subCategoryAdminsService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-admin', 'subcategory-admins'] });
      setIsCreating(false);
      setFormData({ name: '', email: '', subCategoryId: '' });
      setEmailError('');
      setSuccessModal({
        isOpen: true,
        subCategoryAdmin: data,
        tempPassword: data.tempPassword,
        emailSent: data.emailSent,
        emailError: data.emailError,
      });
    },
  });

  const deleteSubCategoryAdminMutation = useMutation({
    mutationFn: (id: string) => subCategoryAdminsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-admin', 'subcategory-admins'] });
      setDeleteModal({ isOpen: false, subCategoryAdmin: null });
    },
  });

  const updateSubCategoryAdminSubCategoriesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubCategoryAdminSubCategoriesDto }) =>
      subCategoryAdminsService.updateSubCategories(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-admin', 'subcategory-admins'] });
      setEditModal({ isOpen: false, subCategoryAdmin: null, selectedSubCategoryIds: [] });
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
      alert('Please enter subcategory admin name');
      return;
    }
    if (!formData.email.trim()) {
      alert('Please enter subcategory admin email');
      return;
    }
    if (!validateDomain(formData.email)) return;
    if (!formData.subCategoryId) {
      alert('Please select a subcategory');
      return;
    }
    createSubCategoryAdminMutation.mutate(formData);
  };

  const handleEditClick = (subCategoryAdmin: SubCategoryAdmin) => {
    const currentSubCategoryIds = subCategoryAdmin.subCategories
      ? subCategoryAdmin.subCategories.map((s) => s.subCategory.id)
      : [subCategoryAdmin.subCategoryId];
    setEditModal({
      isOpen: true,
      subCategoryAdmin,
      selectedSubCategoryIds: currentSubCategoryIds,
    });
  };

  const handleEditSubCategoryToggle = (subCategoryId: string) => {
    setEditModal((prev) => {
      const isSelected = prev.selectedSubCategoryIds.includes(subCategoryId);
      return {
        ...prev,
        selectedSubCategoryIds: isSelected
          ? prev.selectedSubCategoryIds.filter((id) => id !== subCategoryId)
          : [...prev.selectedSubCategoryIds, subCategoryId],
      };
    });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ isOpen: false, subCategoryAdmin: null, tempPassword: '', emailSent: false });
  };

  return (
    <>
      <div className="d-flex justify-content-end mb-4">
        <button type="button" className="admin-btn-primary" onClick={() => setIsCreating(true)}>
          <i className="bi bi-person-plus me-2" aria-hidden />
          Add subcategory admin
        </button>
      </div>

      {isCreating ? (
        <section className="admin-panel admin-panel--nested mb-4" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">New subcategory admin</h2>
            <button
              type="button"
              className="admin-btn-secondary admin-btn-sm"
              onClick={() => {
                setIsCreating(false);
                setFormData({ name: '', email: '', subCategoryId: '' });
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
                  <label className="admin-form-label" htmlFor="sca-name">
                    Name *
                  </label>
                  <input
                    id="sca-name"
                    type="text"
                    className="form-control admin-form-control"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="sca-email">
                    Email *
                  </label>
                  <input
                    id="sca-email"
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
                  <label className="admin-form-label" htmlFor="sca-subcategory">
                    Initial subcategory *
                  </label>
                  <select
                    id="sca-subcategory"
                    className="form-select admin-form-control"
                    required
                    value={formData.subCategoryId}
                    onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                  >
                    <option value="">Select a subcategory</option>
                    {allSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name} ({subcategory.categoryName})
                      </option>
                    ))}
                  </select>
                  {categoriesLoading ? <p className="admin-form-hint mb-0">Loading subcategories…</p> : null}
                  {!categoriesLoading && allSubcategories.length === 0 ? (
                    <p className="admin-form-hint admin-form-hint--error mb-0">
                      No subcategories found. Create subcategories first.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={createSubCategoryAdminMutation.isPending || !!emailError}
                >
                  {createSubCategoryAdminMutation.isPending ? 'Creating…' : 'Create subcategory admin'}
                </button>
              </div>
            </form>
            {createSubCategoryAdminMutation.isError ? (
              <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">
                {mutationErrorMessage(createSubCategoryAdminMutation.error, 'Failed to create subcategory admin.')}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Subcategory admins</h2>
        </div>
        <div className="admin-panel__body">
          <div className="admin-form-callout mb-4">
            <i className="bi bi-info-circle me-2" aria-hidden />
            To give an existing admin access to more subcategories, use <strong>Add subcategories</strong> — no new
            email or login required.
          </div>

          {adminsError ? (
            <p className="admin-form-hint admin-form-hint--error mb-3">
              {mutationErrorMessage(adminsError, 'Failed to load subcategory admins.')}
            </p>
          ) : null}

          {adminsLoading ? (
            <div className="admin-loading-state">Loading subcategory admins…</div>
          ) : subCategoryAdmins && subCategoryAdmins.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subcategories</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subCategoryAdmins.map((admin) => {
                    const labels = subcategoryLabelsForAdmin(admin);
                    return (
                      <tr key={admin.id}>
                        <td className="admin-table__strong">{admin.name}</td>
                        <td>{admin.email}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {labels.map((item) => (
                              <span key={item.id} className="admin-pill admin-pill--neutral">
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
                              Add subcategories
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--danger"
                              title="Delete admin"
                              disabled={deleteSubCategoryAdminMutation.isPending}
                              onClick={() => setDeleteModal({ isOpen: true, subCategoryAdmin: admin })}
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
              <p className="mb-3">No subcategory admins yet.</p>
              <button type="button" className="admin-btn-primary" onClick={() => setIsCreating(true)}>
                Create your first subcategory admin
              </button>
            </div>
          )}

          {deleteSubCategoryAdminMutation.isError ? (
            <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">
              {mutationErrorMessage(deleteSubCategoryAdminMutation.error, 'Failed to delete subcategory admin.')}
            </p>
          ) : null}
        </div>
      </section>

      {successModal.isOpen && successModal.subCategoryAdmin ? (
        <div className="admin-modal-overlay" role="presentation" onClick={closeSuccessModal}>
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="sca-success-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body admin-modal__body--with-close">
              <button type="button" className="admin-modal__close" aria-label="Close" onClick={closeSuccessModal}>
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <div className="admin-modal__head">
                <i className="bi bi-check-circle admin-modal__icon admin-modal__icon--success" aria-hidden />
                <h2 id="sca-success-title" className="admin-modal__title">
                  Subcategory admin created
                </h2>
              </div>
              <div className="admin-credential-box">
                <div className="admin-credential-field">
                  <strong>Name</strong>
                  <div className="admin-credential-value">{successModal.subCategoryAdmin.name}</div>
                </div>
                <div className="admin-credential-field">
                  <strong>Email</strong>
                  <div className="admin-credential-value">{successModal.subCategoryAdmin.email}</div>
                </div>
                <div className="admin-credential-field">
                  <strong>Temporary password</strong>
                  <div className="admin-credential-value admin-credential-value--secret">
                    {successModal.tempPassword}
                  </div>
                </div>
                <div className="admin-credential-field">
                  <strong>Subcategory</strong>
                  <div className="admin-credential-value">{successModal.subCategoryAdmin.subCategory.name}</div>
                </div>
              </div>
              {successModal.emailSent ? (
                <p className="admin-form-hint mb-0">
                  <i className="bi bi-envelope-check me-1" aria-hidden />
                  Email sent to {successModal.subCategoryAdmin.email}
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

      {editModal.isOpen && editModal.subCategoryAdmin && (categories?.length ?? 0) > 0 ? (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setEditModal({ isOpen: false, subCategoryAdmin: null, selectedSubCategoryIds: [] })}
        >
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="sca-edit-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <h2 id="sca-edit-title" className="admin-modal__title mb-2">
                Subcategory access — {editModal.subCategoryAdmin.name}
              </h2>
              <p className="admin-modal__text">
                Select all subcategories this admin should manage. No new login is required.
              </p>
              <p className="admin-form-label mb-2">Current</p>
              <div className="admin-pill-row mb-3">
                {subcategoryLabelsForAdmin(editModal.subCategoryAdmin).map((item) => (
                  <span key={item.id} className="admin-pill admin-pill--neutral">
                    {item.name}
                  </span>
                ))}
              </div>
              <div className="admin-subcategory-stack mb-3">
                {(categories ?? []).map((cat) => (
                  <div key={cat.id} className="mb-3">
                    <p className="admin-form-label mb-2">{cat.name}</p>
                    {(cat.subcategories ?? []).map((subcategory) => (
                      <label
                        key={subcategory.id}
                        className="admin-form-radio d-flex align-items-center gap-2 mb-2"
                      >
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={editModal.selectedSubCategoryIds.includes(subcategory.id)}
                          onChange={() => handleEditSubCategoryToggle(subcategory.id)}
                        />
                        <span>{subcategory.name}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              {editModal.selectedSubCategoryIds.length === 0 ? (
                <p className="admin-form-hint admin-form-hint--error">Select at least one subcategory.</p>
              ) : null}
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setEditModal({ isOpen: false, subCategoryAdmin: null, selectedSubCategoryIds: [] })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={
                    updateSubCategoryAdminSubCategoriesMutation.isPending ||
                    editModal.selectedSubCategoryIds.length === 0
                  }
                  onClick={() => {
                    if (editModal.subCategoryAdmin && editModal.selectedSubCategoryIds.length > 0) {
                      updateSubCategoryAdminSubCategoriesMutation.mutate({
                        id: editModal.subCategoryAdmin.id,
                        data: { subCategoryIds: editModal.selectedSubCategoryIds },
                      });
                    }
                  }}
                >
                  {updateSubCategoryAdminSubCategoriesMutation.isPending ? 'Saving…' : 'Save access'}
                </button>
              </div>
              {updateSubCategoryAdminSubCategoriesMutation.isError ? (
                <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">
                  {mutationErrorMessage(
                    updateSubCategoryAdminSubCategoriesMutation.error,
                    'Failed to update subcategories.',
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {deleteModal.isOpen && deleteModal.subCategoryAdmin ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={() => setDeleteModal({ isOpen: false, subCategoryAdmin: null })}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-labelledby="sca-delete-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <i className="bi bi-exclamation-triangle admin-modal__icon admin-modal__icon--error" aria-hidden />
                <h2 id="sca-delete-title" className="admin-modal__title">
                  Delete subcategory admin?
                </h2>
              </div>
              <p className="admin-modal__text">
                Remove <strong>{deleteModal.subCategoryAdmin.name}</strong> ({deleteModal.subCategoryAdmin.email})?
                This cannot be undone.
              </p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setDeleteModal({ isOpen: false, subCategoryAdmin: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  disabled={deleteSubCategoryAdminMutation.isPending}
                  onClick={() => {
                    if (deleteModal.subCategoryAdmin) {
                      deleteSubCategoryAdminMutation.mutate(deleteModal.subCategoryAdmin.id);
                    }
                  }}
                >
                  {deleteSubCategoryAdminMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
