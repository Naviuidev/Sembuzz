import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { categoriesService, type Category } from '../services/categories.service';
import {
  categoryAdminsService,
  type CreateCategoryAdminDto,
  type CategoryAdmin,
  type UpdateCategoryAdminCategoriesDto,
} from '../services/category-admins.service';

export const SchoolAdminPrivacy = () => {
  const queryClient = useQueryClient();
  const { user } = useSchoolAdminAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryAdminDto>({
    name: '',
    email: '',
    categoryId: '',
  });
  const [emailError, setEmailError] = useState<string>('');
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

  // Get school domain from user context or category admins (after queries are defined)
  const schoolDomain = user?.schoolDomain || (categoryAdmins && categoryAdmins.length > 0 ? categoryAdmins[0].school.domain : null);

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
    if (!validateDomain(formData.email)) {
      return;
    }
    if (!formData.categoryId) {
      alert('Please select a category');
      return;
    }
    createCategoryAdminMutation.mutate(formData);
  };

  const handleDeleteClick = (categoryAdmin: CategoryAdmin) => {
    setDeleteModal({ isOpen: true, categoryAdmin });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.categoryAdmin) {
      deleteCategoryAdminMutation.mutate(deleteModal.categoryAdmin.id);
    }
  };

  const handleEditClick = (categoryAdmin: CategoryAdmin) => {
    // Get current category IDs from the categories array or fallback to single categoryId
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

  const handleEditSubmit = () => {
    if (editModal.categoryAdmin && editModal.selectedCategoryIds.length > 0) {
      updateCategoryAdminCategoriesMutation.mutate({
        id: editModal.categoryAdmin.id,
        data: { categoryIds: editModal.selectedCategoryIds },
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 'normal',
                  color: '#1a1f2e',
                  margin: 0,
                  marginBottom: '0.5rem',
                }}
              >
                Privacy Settings
              </h1>
              <p style={{ color: '#6c757d', fontSize: '1rem', margin: 0 }}>
                Create category admins or grant additional category access to existing admins — no new email required.
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="btn"
              style={{
                backgroundColor: '#1a1f2e',
                border: 'none',
                borderRadius: '50px',
                padding: '0.5rem 1.5rem',
                color: '#fff',
                fontWeight: '500',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.color = '#1a1f2e';
                e.currentTarget.style.border = '1px solid #1a1f2e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1f2e';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.border = 'none';
              }}
            >
              + Add Category Admin
            </button>
          </div>

          {/* Success Modal */}
          {successModal.isOpen && successModal.categoryAdmin && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
              }}
              onClick={() => setSuccessModal({ isOpen: false, categoryAdmin: null, tempPassword: '', emailSent: false })}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  position: 'relative',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSuccessModal({ isOpen: false, categoryAdmin: null, tempPassword: '', emailSent: false })}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: '#1a1f2e',
                    border: 'none',
                    fontSize: '1rem',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    lineHeight: 1,
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1f2e';
                  }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>

                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1a1f2e',
                    marginBottom: '1.5rem',
                    marginTop: 0,
                    paddingRight: '3rem',
                  }}
                >
                  Category Admin Created Successfully
                </h3>

                <div
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <h4 style={{ color: '#1a1f2e', fontSize: '1rem', marginBottom: '1rem' }}>Login Credentials</h4>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#1a1f2e', fontSize: '0.875rem' }}>Name:</strong>
                    <div style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {successModal.categoryAdmin.name}
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#1a1f2e', fontSize: '0.875rem' }}>Email:</strong>
                    <div style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {successModal.categoryAdmin.email}
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#1a1f2e', fontSize: '0.875rem' }}>Temporary Password:</strong>
                    <div
                      style={{
                        color: '#1a1f2e',
                        fontSize: '1rem',
                        fontWeight: '600',
                        marginTop: '0.25rem',
                        fontFamily: 'monospace',
                        backgroundColor: '#f0f0f0',
                        padding: '0.5rem',
                        borderRadius: '4px',
                      }}
                    >
                      {successModal.tempPassword}
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: '#1a1f2e', fontSize: '0.875rem' }}>Category:</strong>
                    <div style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {successModal.categoryAdmin.category.name}
                    </div>
                  </div>
                </div>

                {successModal.emailSent ? (
                  <div
                    style={{
                      backgroundColor: '#d1e7dd',
                      border: '1px solid #badbcc',
                      borderRadius: '4px',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{ color: '#0f5132', fontSize: '0.875rem' }}>
                      <i className="bi bi-check-circle me-2"></i>
                      Email sent successfully to {successModal.categoryAdmin.email}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '4px',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{ color: '#856404', fontSize: '0.875rem' }}>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Email could not be sent.{' '}
                      {successModal.emailError && (
                        <span style={{ fontSize: '0.75rem' }}>({successModal.emailError})</span>
                      )}
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                        Please share the credentials above with the category admin manually.
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-end">
                  <button
                    onClick={() => setSuccessModal({ isOpen: false, categoryAdmin: null, tempPassword: '', emailSent: false })}
                    className="btn"
                    style={{
                      backgroundColor: '#1a1f2e',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#fff',
                      fontWeight: '500',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.color = '#1a1f2e';
                      e.currentTarget.style.border = '1px solid #1a1f2e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a1f2e';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.border = 'none';
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Categories Modal */}
          {editModal.isOpen && editModal.categoryAdmin && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1050,
              }}
              onClick={() => setEditModal({ isOpen: false, categoryAdmin: null, selectedCategoryIds: [] })}
            >
              <div
                className="card border-0 shadow-lg"
                style={{
                  borderRadius: '0px',
                  minWidth: '500px',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <h3
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'normal',
                      color: '#1a1f2e',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Add or remove category access — {editModal.categoryAdmin.name}
                  </h3>
                  <p style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Select all categories this admin should have. You can assign as many as you need; no new email or login required.
                  </p>
                  <p style={{ color: '#1a1f2e', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Current: {editModal.categoryAdmin.categories?.length
                      ? editModal.categoryAdmin.categories.map((c) => c.category.name).join(', ')
                      : editModal.categoryAdmin.category?.name || '—'}
                  </p>

                  <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {categories?.map((category) => (
                      <div key={category.id} className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={editModal.selectedCategoryIds.includes(category.id)}
                          onChange={() => handleEditCategoryToggle(category.id)}
                          style={{ borderRadius: '0px', cursor: 'pointer' }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`category-${category.id}`}
                          style={{
                            color: '#1a1f2e',
                            cursor: 'pointer',
                            marginLeft: '0.5rem',
                            fontWeight: editModal.selectedCategoryIds.includes(category.id) ? '500' : '400',
                          }}
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>

                  {editModal.selectedCategoryIds.length === 0 && (
                    <div className="alert alert-warning" style={{ borderRadius: '0px', marginBottom: '1.5rem' }}>
                      Please select at least one category.
                    </div>
                  )}

                  <div className="d-flex justify-content-end gap-3">
                    <button
                      onClick={() => setEditModal({ isOpen: false, categoryAdmin: null, selectedCategoryIds: [] })}
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSubmit}
                      disabled={updateCategoryAdminCategoriesMutation.isPending || editModal.selectedCategoryIds.length === 0}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        opacity: updateCategoryAdminCategoriesMutation.isPending || editModal.selectedCategoryIds.length === 0 ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!updateCategoryAdminCategoriesMutation.isPending && editModal.selectedCategoryIds.length > 0) {
                          e.currentTarget.style.backgroundColor = '#2d3748';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!updateCategoryAdminCategoriesMutation.isPending && editModal.selectedCategoryIds.length > 0) {
                          e.currentTarget.style.backgroundColor = '#1a1f2e';
                        }
                      }}
                    >
                      {updateCategoryAdminCategoriesMutation.isPending ? 'Saving...' : 'Save category access'}
                    </button>
                  </div>
                  {updateCategoryAdminCategoriesMutation.isError && (
                    <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                      {(updateCategoryAdminCategoriesMutation.error as any)?.response?.data?.message ||
                        'Failed to update categories. Please try again.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal.isOpen && deleteModal.categoryAdmin && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1050,
              }}
              onClick={() => setDeleteModal({ isOpen: false, categoryAdmin: null })}
            >
              <div
                className="card border-0 shadow-lg"
                style={{
                  borderRadius: '0px',
                  minWidth: '400px',
                  maxWidth: '500px',
                  width: '90%',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <h3
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'normal',
                      color: '#1a1f2e',
                      marginBottom: '1rem',
                    }}
                  >
                    Confirm Delete
                  </h3>
                  <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                    Are you sure you want to delete category admin <strong>{deleteModal.categoryAdmin.name}</strong> (
                    {deleteModal.categoryAdmin.email})? This action cannot be undone.
                  </p>
                  <div className="d-flex justify-content-end gap-3">
                    <button
                      onClick={() => setDeleteModal({ isOpen: false, categoryAdmin: null })}
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={deleteCategoryAdminMutation.isPending}
                      className="btn"
                      style={{
                        backgroundColor: '#dc3545',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        opacity: deleteCategoryAdminMutation.isPending ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!deleteCategoryAdminMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!deleteCategoryAdminMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#dc3545';
                        }
                      }}
                    >
                      {deleteCategoryAdminMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Category Admin Form */}
          {isCreating && (
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px' }}>
              <div className="card-body p-4">
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'normal',
                    color: '#1a1f2e',
                    marginBottom: '1.5rem',
                  }}
                >
                  Create Category Admin
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Category Admin Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., John Doe"
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Category Admin Email *
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={formData.email}
                        onChange={handleEmailChange}
                        placeholder={`e.g., admin@${schoolDomain || 'school.edu'}`}
                        style={{
                          borderRadius: '0px',
                          padding: '0.75rem 1rem',
                          borderColor: emailError ? '#dc3545' : undefined,
                        }}
                      />
                      {emailError && (
                        <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          {emailError}
                        </div>
                      )}
                      {schoolDomain && !emailError && formData.email && (
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Email domain must match: {schoolDomain}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                      Select Category *
                    </label>
                    <select
                      className="form-select"
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                    >
                      <option value="">Select a category</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categoriesLoading && (
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Loading categories...
                      </small>
                    )}
                  </div>

                  <div className="d-flex justify-content-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setFormData({ name: '', email: '', categoryId: '' });
                        setEmailError('');
                      }}
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createCategoryAdminMutation.isPending || !!emailError}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        opacity: createCategoryAdminMutation.isPending || !!emailError ? 0.7 : 1,
                      }}
                    >
                      {createCategoryAdminMutation.isPending ? 'Creating...' : 'Create Category Admin'}
                    </button>
                  </div>
                </form>
                {createCategoryAdminMutation.isError && (
                  <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                    {(createCategoryAdminMutation.error as any)?.response?.data?.message ||
                      'Failed to create category admin. Please try again.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Admins List */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <div
                style={{
                  backgroundColor: '#e7f1ff',
                  border: '1px solid #b6d4fe',
                  borderRadius: '0px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.875rem',
                  color: '#084298',
                }}
              >
                <i className="bi bi-info-circle me-2" />
                To give an existing admin access to more categories, click <strong>Add categories</strong> — no new email or login required.
              </div>
              {adminsLoading ? (
                <div className="text-center py-5">
                  <p style={{ color: '#6c757d' }}>Loading category admins...</p>
                </div>
              ) : categoryAdmins && categoryAdmins.length > 0 ? (
                <div className="table-responsive">
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ border: 'none', color: '#1a1f2e', fontWeight: '500', padding: '0.75rem' }}>
                          Name
                        </th>
                        <th style={{ border: 'none', color: '#1a1f2e', fontWeight: '500', padding: '0.75rem' }}>
                          Email
                        </th>
                        <th style={{ border: 'none', color: '#1a1f2e', fontWeight: '500', padding: '0.75rem' }}>
                          Categories
                        </th>
                        <th style={{ border: 'none', color: '#1a1f2e', fontWeight: '500', padding: '0.75rem' }}>
                          Status
                        </th>
                        <th style={{ border: 'none', color: '#1a1f2e', fontWeight: '500', padding: '0.75rem', textAlign: 'right' }}>
                          Add / manage categories
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryAdmins.map((admin) => (
                        <tr key={admin.id}>
                          <td style={{ border: 'none', padding: '0.75rem', color: '#1a1f2e' }}>{admin.name}</td>
                          <td style={{ border: 'none', padding: '0.75rem', color: '#6c757d' }}>{admin.email}</td>
                          <td style={{ border: 'none', padding: '0.75rem', color: '#6c757d' }}>
                            <div className="d-flex flex-wrap gap-1">
                              {admin.categories && admin.categories.length > 0
                                ? admin.categories.map((c) => (
                                    <span
                                      key={c.category.id}
                                      className="badge rounded-pill"
                                      style={{
                                        backgroundColor: '#d1e7dd',
                                        color: '#0f5132',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        padding: '0.35rem 0.65rem',
                                      }}
                                    >
                                      {c.category.name}
                                    </span>
                                  ))
                                : (
                                    <span
                                      className="badge rounded-pill"
                                      style={{
                                        backgroundColor: '#d1e7dd',
                                        color: '#0f5132',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        padding: '0.35rem 0.65rem',
                                      }}
                                    >
                                      {admin.category.name}
                                    </span>
                                  )}
                            </div>
                          </td>
                          <td style={{ border: 'none', padding: '0.75rem' }}>
                            <span
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: admin.isActive ? '#d1e7dd' : '#f8d7da',
                                color: admin.isActive ? '#0f5132' : '#842029',
                                fontSize: '0.75rem',
                                borderRadius: '50px',
                                border: '1px solid #dee2e6',
                              }}
                            >
                              {admin.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ border: 'none', padding: '0.75rem', textAlign: 'right' }}>
                            <div className="d-flex gap-2 justify-content-end align-items-center">
                              <button
                                onClick={() => handleEditClick(admin)}
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: '#1a1f2e',
                                  border: 'none',
                                  borderRadius: '0px',
                                  color: '#fff',
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  transition: 'all 0.3s',
                                }}
                                title="Add or remove category access for this admin"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#2d3748';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#1a1f2e';
                                }}
                              >
                                <i className="bi bi-plus-circle" style={{ fontSize: '1rem' }}></i>
                                Add categories
                              </button>
                              <button
                                onClick={() => handleDeleteClick(admin)}
                                disabled={deleteCategoryAdminMutation.isPending}
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: '#dc3545',
                                  border: 'none',
                                  borderRadius: '0px',
                                  color: '#fff',
                                  padding: '0.5rem',
                                  width: '36px',
                                  height: '36px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: deleteCategoryAdminMutation.isPending ? 0.7 : 1,
                                  transition: 'all 0.3s',
                                }}
                                title="Delete"
                                onMouseEnter={(e) => {
                                  if (!deleteCategoryAdminMutation.isPending) {
                                    e.currentTarget.style.backgroundColor = '#c82333';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!deleteCategoryAdminMutation.isPending) {
                                    e.currentTarget.style.backgroundColor = '#dc3545';
                                  }
                                }}
                              >
                                <i className="bi bi-trash" style={{ fontSize: '1rem' }}></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p style={{ color: '#6c757d', marginBottom: '1rem' }}>No category admins found.</p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="btn"
                    style={{
                      backgroundColor: '#1a1f2e',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#fff',
                      fontWeight: '500',
                    }}
                  >
                    Create Your First Category Admin
                  </button>
                </div>
              )}
              {deleteCategoryAdminMutation.isError && (
                <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                  {(deleteCategoryAdminMutation.error as any)?.response?.data?.message ||
                    'Failed to delete category admin. Please try again.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
