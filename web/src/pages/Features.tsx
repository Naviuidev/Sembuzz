import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';
import { featuresService, type CreateFeatureDto, type UpdateFeatureDto } from '../services/features.service';
import type { Feature } from '../services/schools.service';

export const Features = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; feature: Feature | null }>({
    isOpen: false,
    feature: null,
  });
  const [formData, setFormData] = useState<CreateFeatureDto>({
    code: '',
    name: '',
  });
  const [editFormData, setEditFormData] = useState<UpdateFeatureDto>({
    name: '',
  });

  const { data: features, isLoading } = useQuery<Feature[]>({
    queryKey: ['features'],
    queryFn: featuresService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: featuresService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setIsCreating(false);
      setFormData({ code: '', name: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeatureDto }) =>
      featuresService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setEditingId(null);
      setEditFormData({ name: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: featuresService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setDeleteModal({ isOpen: false, feature: null });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      alert('Please fill in all fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (feature: Feature) => {
    setEditingId(feature.id);
    setEditFormData({ name: feature.name });
  };

  const handleUpdate = (id: string) => {
    if (!editFormData.name.trim()) {
      alert('Please enter a feature name');
      return;
    }
    updateMutation.mutate({ id, data: editFormData });
  };

  const handleDeleteClick = (feature: Feature) => {
    setDeleteModal({ isOpen: true, feature });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.feature) {
      deleteMutation.mutate(deleteModal.feature.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, feature: null });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: '' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SuperAdminNavbar />
      <div className="d-flex">
        <SuperAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          {/* Delete Confirmation Modal */}
          {deleteModal.isOpen && deleteModal.feature && (
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
              onClick={handleDeleteCancel}
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
                    Are you sure you want to delete <strong>"{deleteModal.feature.name}"</strong>? This action
                    cannot be undone.
                  </p>
                  <div className="d-flex justify-content-end gap-3">
                    <button
                      onClick={handleDeleteCancel}
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
                      disabled={deleteMutation.isPending}
                      className="btn"
                      style={{
                        backgroundColor: '#dc3545',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        opacity: deleteMutation.isPending ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!deleteMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!deleteMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#dc3545';
                        }
                      }}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  {deleteMutation.isError && (
                    <div className="alert alert-danger mt-3" style={{ borderRadius: '0px', marginBottom: 0 }}>
                      {(deleteMutation.error as any)?.response?.data?.message ||
                        'Failed to delete feature. Please try again.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 'normal',
                color: '#1a1f2e',
                margin: 0,
              }}
            >
              Features Management
            </h1>
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
              + Add Feature
            </button>
          </div>

          {/* Create Form */}
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
                  Create New Feature
                </h2>
                <form onSubmit={handleCreate}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Feature Code *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z_]/g, '') })
                        }
                        placeholder="e.g., NEWS, EVENTS"
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                        pattern="[A-Z_]+"
                        title="Code must contain only uppercase letters and underscores"
                      />
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Uppercase letters and underscores only (e.g., NEWS, EVENTS, INSTAGRAM)
                      </small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Feature Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., News, Events"
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setFormData({ code: '', name: '' });
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
                      disabled={createMutation.isPending}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        opacity: createMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
                {createMutation.isError && (
                  <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                    {(createMutation.error as any)?.response?.data?.message ||
                      'Failed to create feature. Please try again.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              {isLoading ? (
                <div className="text-center py-5">
                  <p style={{ color: '#6c757d' }}>Loading features...</p>
                </div>
              ) : features && features.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                        <th
                          style={{
                            fontWeight: '500',
                            color: '#1a1f2e',
                            padding: '1rem',
                            borderBottom: 'none',
                          }}
                        >
                          Code
                        </th>
                        <th
                          style={{
                            fontWeight: '500',
                            color: '#1a1f2e',
                            padding: '1rem',
                            borderBottom: 'none',
                          }}
                        >
                          Name
                        </th>
                        <th
                          style={{
                            fontWeight: '500',
                            color: '#1a1f2e',
                            padding: '1rem',
                            borderBottom: 'none',
                          }}
                        >
                          Created At
                        </th>
                        <th
                          style={{
                            fontWeight: '500',
                            color: '#1a1f2e',
                            padding: '1rem',
                            borderBottom: 'none',
                            width: '200px',
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((feature) => (
                        <tr key={feature.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td
                            style={{
                              padding: '1rem',
                              color: '#1a1f2e',
                              fontFamily: 'monospace',
                              fontSize: '0.9rem',
                              fontWeight: '500',
                            }}
                          >
                            {feature.code}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {editingId === feature.id ? (
                              <input
                                type="text"
                                className="form-control"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ name: e.target.value })}
                                style={{ borderRadius: '0px', padding: '0.5rem 0.75rem' }}
                                autoFocus
                              />
                            ) : (
                              <span style={{ color: '#1a1f2e' }}>{feature.name}</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', color: '#6c757d', fontSize: '0.9rem' }}>
                            {new Date(feature.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {editingId === feature.id ? (
                              <div className="d-flex gap-2">
                                <button
                                  onClick={() => handleUpdate(feature.id)}
                                  disabled={updateMutation.isPending}
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: '#1a1f2e',
                                    border: 'none',
                                    borderRadius: '0px',
                                    color: '#fff',
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.875rem',
                                    opacity: updateMutation.isPending ? 0.7 : 1,
                                  }}
                                >
                                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '0px',
                                    color: '#1a1f2e',
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex gap-2">
                                <button
                                  onClick={() => handleEdit(feature)}
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #1a1f2e',
                                    borderRadius: '0px',
                                    color: '#1a1f2e',
                                    padding: '0.5rem',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s',
                                  }}
                                  title="Edit"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1a1f2e';
                                    e.currentTarget.style.color = '#fff';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#1a1f2e';
                                  }}
                                >
                                  <i className="bi bi-pencil" style={{ fontSize: '1rem' }}></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(feature)}
                                  disabled={deleteMutation.isPending}
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
                                    opacity: deleteMutation.isPending ? 0.7 : 1,
                                    transition: 'all 0.3s',
                                  }}
                                  title="Delete"
                                  onMouseEnter={(e) => {
                                    if (!deleteMutation.isPending) {
                                      e.currentTarget.style.backgroundColor = '#c82333';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!deleteMutation.isPending) {
                                      e.currentTarget.style.backgroundColor = '#dc3545';
                                    }
                                  }}
                                >
                                  <i className="bi bi-trash" style={{ fontSize: '1rem' }}></i>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <p style={{ color: '#6c757d', marginBottom: '1rem' }}>No features found.</p>
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
                    Create Your First Feature
                  </button>
                </div>
              )}
              {updateMutation.isError && (
                <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                  {(updateMutation.error as any)?.response?.data?.message ||
                    'Failed to update feature. Please try again.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
