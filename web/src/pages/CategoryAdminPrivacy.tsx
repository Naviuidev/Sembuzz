import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryAdminNavbar } from '../components/CategoryAdminNavbar';
import { CategoryAdminSidebar } from '../components/CategoryAdminSidebar';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { categoryAdminCategoriesService } from '../services/category-admin-categories.service';
import {
  subCategoryAdminsService,
  type CreateSubCategoryAdminDto,
  type SubCategoryAdmin,
  type UpdateSubCategoryAdminSubCategoriesDto,
} from '../services/subcategory-admins.service';

export const CategoryAdminPrivacy = () => {
  const queryClient = useQueryClient();
  const { user, token } = useCategoryAdminAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateSubCategoryAdminDto>({
    name: '',
    email: '',
    subCategoryId: '',
  });
  const [emailError, setEmailError] = useState<string>('');
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

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category-admin-category'],
    queryFn: categoryAdminCategoriesService.getMyCategory,
    enabled: !!user?.categoryId,
  });

  const { data: subCategoryAdmins, isLoading: adminsLoading, error: adminsError } = useQuery<SubCategoryAdmin[]>({
    queryKey: ['category-admin', 'subcategory-admins', user?.id],
    queryFn: () => subCategoryAdminsService.getAll(),
    enabled: !!token,
  });

  // Get school domain from user context, category data, or subcategory admins
  const schoolDomain = user?.schoolDomain || 
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
    if (!validateDomain(formData.email)) {
      return;
    }
    if (!formData.subCategoryId) {
      alert('Please select a subcategory');
      return;
    }
    createSubCategoryAdminMutation.mutate(formData);
  };

  const handleDeleteClick = (subCategoryAdmin: SubCategoryAdmin) => {
    setDeleteModal({ isOpen: true, subCategoryAdmin });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.subCategoryAdmin) {
      deleteSubCategoryAdminMutation.mutate(deleteModal.subCategoryAdmin.id);
    }
  };

  const handleEditClick = (subCategoryAdmin: SubCategoryAdmin) => {
    // Get current subcategory IDs from the subCategories array or fallback to single subCategoryId
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

  const handleEditSubmit = () => {
    if (editModal.subCategoryAdmin && editModal.selectedSubCategoryIds.length > 0) {
      updateSubCategoryAdminSubCategoriesMutation.mutate({
        id: editModal.subCategoryAdmin.id,
        data: { subCategoryIds: editModal.selectedSubCategoryIds },
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <CategoryAdminNavbar />
      <div className="d-flex">
        <CategoryAdminSidebar />
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
                Create subcategory admins or grant additional subcategory access to existing admins — no new email required.
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
              + Add Subcategory Admin
            </button>
          </div>

          {/* Success Modal */}
          {successModal.isOpen && successModal.subCategoryAdmin && (
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
              onClick={() => setSuccessModal({ isOpen: false, subCategoryAdmin: null, tempPassword: '', emailSent: false })}
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
                  onClick={() => setSuccessModal({ isOpen: false, subCategoryAdmin: null, tempPassword: '', emailSent: false })}
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
                  Subcategory Admin Created Successfully
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
                      {successModal.subCategoryAdmin.name}
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#1a1f2e', fontSize: '0.875rem' }}>Email:</strong>
                    <div style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {successModal.subCategoryAdmin.email}
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
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#1a1f2e', fontSize: '0.875rem' }}>Subcategory:</strong>
                    <div style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {successModal.subCategoryAdmin.subCategory.name}
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
                      Email sent successfully to {successModal.subCategoryAdmin.email}
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
                        Please share the credentials above with the subcategory admin manually.
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-end">
                  <button
                    onClick={() => setSuccessModal({ isOpen: false, subCategoryAdmin: null, tempPassword: '', emailSent: false })}
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

          {/* Edit Subcategories Modal */}
          {editModal.isOpen && editModal.subCategoryAdmin && category && (
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
              onClick={() => setEditModal({ isOpen: false, subCategoryAdmin: null, selectedSubCategoryIds: [] })}
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
                    Add or remove subcategory access — {editModal.subCategoryAdmin.name}
                  </h3>
                  <p style={{ color: '#6c757d', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Select all subcategories this admin should have. You can assign as many as you need; no new email or login required.
                  </p>
                  <p style={{ color: '#1a1f2e', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Current: {editModal.subCategoryAdmin.subCategories?.length
                      ? editModal.subCategoryAdmin.subCategories.map((s) => s.subCategory.name).join(', ')
                      : editModal.subCategoryAdmin.subCategory?.name || '—'}
                  </p>

                  <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {category.subcategories?.map((subcategory) => (
                      <div key={subcategory.id} className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`subcategory-${subcategory.id}`}
                          checked={editModal.selectedSubCategoryIds.includes(subcategory.id)}
                          onChange={() => handleEditSubCategoryToggle(subcategory.id)}
                          style={{ borderRadius: '0px', cursor: 'pointer' }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`subcategory-${subcategory.id}`}
                          style={{
                            color: '#1a1f2e',
                            cursor: 'pointer',
                            marginLeft: '0.5rem',
                            fontWeight: editModal.selectedSubCategoryIds.includes(subcategory.id) ? '500' : '400',
                          }}
                        >
                          {subcategory.name}
                        </label>
                      </div>
                    ))}
                  </div>

                  {editModal.selectedSubCategoryIds.length === 0 && (
                    <div className="alert alert-warning" style={{ borderRadius: '0px', marginBottom: '1.5rem' }}>
                      Please select at least one subcategory.
                    </div>
                  )}

                  <div className="d-flex justify-content-end gap-3">
                    <button
                      onClick={() => setEditModal({ isOpen: false, subCategoryAdmin: null, selectedSubCategoryIds: [] })}
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
                      disabled={updateSubCategoryAdminSubCategoriesMutation.isPending || editModal.selectedSubCategoryIds.length === 0}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        opacity: updateSubCategoryAdminSubCategoriesMutation.isPending || editModal.selectedSubCategoryIds.length === 0 ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!updateSubCategoryAdminSubCategoriesMutation.isPending && editModal.selectedSubCategoryIds.length > 0) {
                          e.currentTarget.style.backgroundColor = '#2d3748';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!updateSubCategoryAdminSubCategoriesMutation.isPending && editModal.selectedSubCategoryIds.length > 0) {
                          e.currentTarget.style.backgroundColor = '#1a1f2e';
                        }
                      }}
                    >
                      {updateSubCategoryAdminSubCategoriesMutation.isPending ? 'Saving...' : 'Save subcategory access'}
                    </button>
                  </div>
                  {updateSubCategoryAdminSubCategoriesMutation.isError && (
                    <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                      {(updateSubCategoryAdminSubCategoriesMutation.error as any)?.response?.data?.message ||
                        'Failed to update subcategories. Please try again.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal.isOpen && deleteModal.subCategoryAdmin && (
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
              onClick={() => setDeleteModal({ isOpen: false, subCategoryAdmin: null })}
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
                    Are you sure you want to delete subcategory admin <strong>{deleteModal.subCategoryAdmin.name}</strong> (
                    {deleteModal.subCategoryAdmin.email})? This action cannot be undone.
                  </p>
                  <div className="d-flex justify-content-end gap-3">
                    <button
                      onClick={() => setDeleteModal({ isOpen: false, subCategoryAdmin: null })}
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
                      disabled={deleteSubCategoryAdminMutation.isPending}
                      className="btn"
                      style={{
                        backgroundColor: '#dc3545',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        opacity: deleteSubCategoryAdminMutation.isPending ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!deleteSubCategoryAdminMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!deleteSubCategoryAdminMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#dc3545';
                        }
                      }}
                    >
                      {deleteSubCategoryAdminMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Subcategory Admin Form */}
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
                  Create Subcategory Admin
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Subcategory Admin Name *
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
                        Subcategory Admin Email *
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
                      Select Subcategory *
                    </label>
                    <select
                      className="form-select"
                      required
                      value={formData.subCategoryId}
                      onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                      style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                    >
                      <option value="">Select a subcategory</option>
                      {category?.subcategories?.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                    {categoryLoading && (
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Loading subcategories...
                      </small>
                    )}
                    {!categoryLoading && category && (!category.subcategories || category.subcategories.length === 0) && (
                      <small className="text-muted" style={{ fontSize: '0.75rem', color: '#dc3545' }}>
                        No subcategories found. Please create subcategories first.
                      </small>
                    )}
                  </div>

                  <div className="d-flex justify-content-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setFormData({ name: '', email: '', subCategoryId: '' });
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
                      disabled={createSubCategoryAdminMutation.isPending || !!emailError}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        opacity: createSubCategoryAdminMutation.isPending || !!emailError ? 0.7 : 1,
                      }}
                    >
                      {createSubCategoryAdminMutation.isPending ? 'Creating...' : 'Create Subcategory Admin'}
                    </button>
                  </div>
                </form>
                {createSubCategoryAdminMutation.isError && (
                  <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                    {(createSubCategoryAdminMutation.error as any)?.response?.data?.message ||
                      'Failed to create subcategory admin. Please try again.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subcategory Admins List */}
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
                To give an existing admin access to more subcategories, click <strong>Add subcategories</strong> — no new email or login required.
              </div>
              {adminsError && (
                <div className="alert alert-warning mb-3" style={{ borderRadius: '0px' }}>
                  {(adminsError as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (adminsError as Error).message}
                </div>
              )}
              {adminsLoading ? (
                <div className="text-center py-5">
                  <p style={{ color: '#6c757d' }}>Loading subcategory admins...</p>
                </div>
              ) : subCategoryAdmins && subCategoryAdmins.length > 0 ? (
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
                          Subcategories
                        </th>
                        <th style={{ border: 'none', color: '#1a1f2e', fontWeight: '500', padding: '0.75rem' }}>
                          Status
                        </th>
                        <th style={{ border: 'none', color: '#1a1f2e', fontWeight: '500', padding: '0.75rem', textAlign: 'right' }}>
                          Add / manage subcategories
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subCategoryAdmins.map((admin) => (
                        <tr key={admin.id}>
                          <td style={{ border: 'none', padding: '0.75rem', color: '#1a1f2e' }}>{admin.name}</td>
                          <td style={{ border: 'none', padding: '0.75rem', color: '#6c757d' }}>{admin.email}</td>
                          <td style={{ border: 'none', padding: '0.75rem', color: '#6c757d' }}>
                            {admin.subCategories && admin.subCategories.length > 0
                              ? admin.subCategories.map((s) => s.subCategory.name).join(', ')
                              : admin.subCategory.name}
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
                                title="Add or remove subcategory access for this admin"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#2d3748';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#1a1f2e';
                                }}
                              >
                                <i className="bi bi-plus-circle" style={{ fontSize: '1rem' }}></i>
                                Add subcategories
                              </button>
                              <button
                                onClick={() => handleDeleteClick(admin)}
                                disabled={deleteSubCategoryAdminMutation.isPending}
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
                                  opacity: deleteSubCategoryAdminMutation.isPending ? 0.7 : 1,
                                  transition: 'all 0.3s',
                                }}
                                title="Delete"
                                onMouseEnter={(e) => {
                                  if (!deleteSubCategoryAdminMutation.isPending) {
                                    e.currentTarget.style.backgroundColor = '#c82333';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!deleteSubCategoryAdminMutation.isPending) {
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
                  <p style={{ color: '#6c757d', marginBottom: '1rem' }}>No subcategory admins found.</p>
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
                    Create Your First Subcategory Admin
                  </button>
                </div>
              )}
              {deleteSubCategoryAdminMutation.isError && (
                <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                  {(deleteSubCategoryAdminMutation.error as any)?.response?.data?.message ||
                    'Failed to delete subcategory admin. Please try again.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
