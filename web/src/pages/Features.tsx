import { useState, type CSSProperties, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { featuresService, type CreateFeatureDto, type UpdateFeatureDto } from '../services/features.service';
import type { Feature } from '../services/schools.service';

function getMutationMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export const Features = () => {
  const queryClient = useQueryClient();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
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
      setCreateError(null);
    },
    onError: (error) => {
      setCreateError(getMutationMessage(error, 'Failed to create feature. Please try again.'));
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

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setCreateError('Please fill in all fields.');
      return;
    }
    setCreateError(null);
    createMutation.mutate(formData);
  };

  const handleEdit = (feature: Feature) => {
    setEditingId(feature.id);
    setEditFormData({ name: feature.name });
  };

  const handleUpdate = (id: string) => {
    if (!editFormData.name.trim()) {
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

  const closeCreate = () => {
    setIsCreating(false);
    setFormData({ code: '', name: '' });
    setCreateError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: '' });
  };

  return (
    <SuperAdminLayout>
      {deleteModal.isOpen && deleteModal.feature ? (
        <div className="admin-modal-overlay" onClick={() => setDeleteModal({ isOpen: false, feature: null })} role="presentation">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <i className="bi bi-trash admin-modal__icon admin-modal__icon--error" aria-hidden />
                <h3 className="admin-modal__title">Delete feature?</h3>
              </div>
              <p className="admin-modal__text">
                Are you sure you want to delete <strong>{deleteModal.feature.name}</strong>? This cannot be
                undone.
              </p>
              {deleteMutation.isError ? (
                <div className="alert alert-danger rounded-3 mb-3">
                  {getMutationMessage(deleteMutation.error, 'Failed to delete feature. Please try again.')}
                </div>
              ) : null}
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setDeleteModal({ isOpen: false, feature: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <header className="admin-page-header">
        <h1 className="admin-page-title">Features</h1>
        <p className="admin-page-subtitle">
          Manage platform features available when creating or editing schools.
        </p>
      </header>

      {isCreating ? (
        <section className="admin-panel admin-panel--nested" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">New feature</h2>
          </div>
          <div className="admin-panel__body">
            <form className="admin-form" onSubmit={handleCreate}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="feature-code">
                    Feature code *
                  </label>
                  <input
                    id="feature-code"
                    type="text"
                    className="form-control"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z_]/g, '') })
                    }
                    placeholder="e.g., NEWS, EVENTS"
                    pattern="[A-Z_]+"
                    title="Code must contain only uppercase letters and underscores"
                  />
                  <small className="admin-form-hint">Uppercase letters and underscores only.</small>
                </div>
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="feature-name">
                    Feature name *
                  </label>
                  <input
                    id="feature-name"
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., News, Events"
                  />
                </div>
              </div>
              {createError ? (
                <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">{createError}</p>
              ) : null}
              {createMutation.isError && !createError ? (
                <p className="admin-form-hint admin-form-hint--error mt-3 mb-0">
                  {getMutationMessage(createMutation.error, 'Failed to create feature. Please try again.')}
                </p>
              ) : null}
              <div className="admin-form-actions">
                <button type="button" className="admin-btn-secondary" onClick={closeCreate}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating…' : 'Create feature'}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">All features</h2>
          {!isCreating ? (
            <button type="button" className="admin-btn-primary" onClick={() => setIsCreating(true)}>
              + Add feature
            </button>
          ) : null}
        </div>
        <div className="admin-panel__body admin-panel__body--flush-top">
          {isLoading ? (
            <div className="admin-loading-state">
              <span className="spinner-border spinner-border-sm text-secondary me-2" role="status" />
              Loading features…
            </div>
          ) : features && features.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Code</th>
                    <th scope="col">Name</th>
                    <th scope="col">Created</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => (
                    <tr key={feature.id}>
                      <td>
                        <span className="admin-pill admin-pill--feature admin-table__mono">{feature.code}</span>
                      </td>
                      <td>
                        {editingId === feature.id ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ name: e.target.value })}
                            autoFocus
                          />
                        ) : (
                          <span className="admin-table__strong">{feature.name}</span>
                        )}
                      </td>
                      <td>{new Date(feature.createdAt).toLocaleDateString()}</td>
                      <td>
                        {editingId === feature.id ? (
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-btn-primary admin-btn-sm"
                              onClick={() => handleUpdate(feature.id)}
                              disabled={updateMutation.isPending || !editFormData.name.trim()}
                            >
                              {updateMutation.isPending ? 'Saving…' : 'Save'}
                            </button>
                            <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--edit"
                              onClick={() => handleEdit(feature)}
                              title="Edit name"
                              aria-label={`Edit ${feature.name}`}
                            >
                              <i className="bi bi-pencil" aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--danger"
                              onClick={() => handleDeleteClick(feature)}
                              disabled={deleteMutation.isPending}
                              title="Delete"
                              aria-label={`Delete ${feature.name}`}
                            >
                              <i className="bi bi-trash" aria-hidden />
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
            <div className="admin-empty-state">
              <p>No features yet.</p>
              <button type="button" className="admin-btn-primary" onClick={() => setIsCreating(true)}>
                Create your first feature
              </button>
            </div>
          )}
          {updateMutation.isError ? (
            <div className="alert alert-danger rounded-3 mt-3 mb-0">
              {getMutationMessage(updateMutation.error, 'Failed to update feature. Please try again.')}
            </div>
          ) : null}
        </div>
      </section>
    </SuperAdminLayout>
  );
};
