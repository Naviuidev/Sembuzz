import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  externalAdminService,
  type ExternalAdminRow,
  type ExternalCategory,
} from '../services/external-admin.service';

export const SuperAdminExternal = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteAdminModal, setDeleteAdminModal] = useState<{
    isOpen: boolean;
    admin: ExternalAdminRow | null;
  }>({ isOpen: false, admin: null });
  const [editAdminModal, setEditAdminModal] = useState<ExternalAdminRow | null>(null);
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editCategoriesError, setEditCategoriesError] = useState<string | null>(null);
  const [editCategoriesSuccessOpen, setEditCategoriesSuccessOpen] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['super-admin', 'external', 'categories'],
    queryFn: externalAdminService.listCategories,
  });

  const { data: admins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['super-admin', 'external', 'admins'],
    queryFn: externalAdminService.listAdmins,
  });

  const createCategory = useMutation({
    mutationFn: externalAdminService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'external', 'categories'] });
      setName('');
      setDescription('');
      setSortOrder('0');
      setFormError(null);
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setFormError(typeof msg === 'string' ? msg : 'Failed to create category.');
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      externalAdminService.updateCategory(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'external', 'categories'] });
    },
  });

  const removeCategory = useMutation({
    mutationFn: externalAdminService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'external', 'categories'] });
    },
  });

  const toggleAdminBan = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      externalAdminService.updateAdmin(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'external', 'admins'] });
    },
  });

  const updateAdminCategories = useMutation({
    mutationFn: () => {
      if (!editAdminModal) throw new Error('No admin');
      return externalAdminService.updateAdmin(editAdminModal.id, { categoryIds: editCategoryIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'external', 'admins'] });
      setEditAdminModal(null);
      setEditCategoriesError(null);
      setEditCategoriesSuccessOpen(true);
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setEditCategoriesError(typeof msg === 'string' ? msg : 'Failed to update categories.');
    },
  });

  const removeAdmin = useMutation({
    mutationFn: externalAdminService.deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'external', 'admins'] });
      setDeleteAdminModal({ isOpen: false, admin: null });
    },
  });

  const closeDeleteAdminModal = () => {
    if (!removeAdmin.isPending) {
      setDeleteAdminModal({ isOpen: false, admin: null });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    createCategory.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      sortOrder: Number.parseInt(sortOrder, 10) || 0,
      isActive: true,
    });
  };

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  const openEditCategories = (admin: ExternalAdminRow) => {
    setEditAdminModal(admin);
    setEditCategoryIds(admin.categories.map((link) => link.externalCategory.id));
    setEditCategoriesError(null);
  };

  const closeEditCategories = () => {
    if (!updateAdminCategories.isPending) {
      setEditAdminModal(null);
      setEditCategoriesError(null);
    }
  };

  const toggleEditCategory = (id: string) => {
    setEditCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const assignableCategories = useMemo(() => {
    if (!editAdminModal) return [];
    const active = categories.filter((c) => c.isActive);
    const assignedInactive = categories.filter(
      (c) => !c.isActive && editCategoryIds.includes(c.id),
    );
    const byId = new Map<string, ExternalCategory>();
    for (const c of [...active, ...assignedInactive]) byId.set(c.id, c);
    return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [categories, editAdminModal, editCategoryIds]);

  const saveEditCategories = () => {
    setEditCategoriesError(null);
    if (editCategoryIds.length === 0) {
      setEditCategoriesError('Select at least one external category.');
      return;
    }
    updateAdminCategories.mutate();
  };

  return (
    <SuperAdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">External categories</h1>
          <p className="admin-page-header__subtitle">
            Create platform-wide categories, assign them when you create an external admin, or edit an admin to add categories later.
          </p>
        </div>
        <Link to="/super-admin/external/admins/new" className="admin-btn-primary">
          + Create external admin
        </Link>
      </div>

      <div className="row g-4 super-admin-external-layout">
        <div className="col-lg-4 col-xl-3">
          <section className="admin-panel super-admin-external-new-category" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">New category</h2>
            </div>
            <div className="admin-panel__body">
              <form onSubmit={onSubmit} className="d-flex flex-column gap-2">
                <div>
                  <label className="form-label small fw-semibold mb-1">Name</label>
                  <input
                    className="form-control form-control-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Community partners"
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="form-label small fw-semibold mb-1">Description (optional)</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="form-label small fw-semibold mb-1">Sort order</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>
                {formError ? <p className="small text-danger mb-0">{formError}</p> : null}
                <button
                  type="submit"
                  className="admin-btn-primary admin-btn-sm align-self-start"
                  disabled={createCategory.isPending}
                >
                  {createCategory.isPending ? 'Saving…' : 'Add category'}
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="col-lg-8 col-xl-9 super-admin-external-main d-flex flex-column gap-4">
          <section className="admin-panel super-admin-external-list-panel flex-grow-1" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Categories</h2>
            </div>
            <div className="admin-panel__body admin-panel__body--flush-top">
              {isLoading ? (
                <div className="admin-loading-state">Loading categories…</div>
              ) : categories.length === 0 ? (
                <div className="admin-empty-state">
                  <p>No external categories yet. Add one to show in the public feed sidebar.</p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Order</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat: ExternalCategory) => (
                        <tr key={cat.id}>
                          <td>
                            <span className="admin-table__strong">{cat.name}</span>
                            {cat.description ? (
                              <div className="small text-muted">{cat.description}</div>
                            ) : null}
                          </td>
                          <td>{cat.sortOrder}</td>
                          <td>
                            <span
                              className={`admin-pill ${cat.isActive ? 'admin-pill--active' : 'admin-pill--inactive'}`}
                            >
                              {cat.isActive ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  toggleActive.mutate({ id: cat.id, isActive: !cat.isActive })
                                }
                              >
                                {cat.isActive ? 'Hide' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  if (window.confirm(`Delete "${cat.name}"?`)) {
                                    removeCategory.mutate(cat.id);
                                  }
                                }}
                              >
                                Delete
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

          <section className="admin-panel super-admin-external-list-panel flex-grow-1" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">External admins</h2>
            </div>
            <div className="admin-panel__body admin-panel__body--flush-top">
              {adminsLoading ? (
                <div className="admin-loading-state">Loading admins…</div>
              ) : admins.length === 0 ? (
                <div className="admin-empty-state">
                  <p>No external admins yet.</p>
                  <Link to="/super-admin/external/admins/new" className="admin-btn-primary">
                    Create external admin
                  </Link>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Ref</th>
                        <th>Name</th>
                        <th>Categories</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.id}>
                          <td className="admin-table__mono">{admin.refNum}</td>
                          <td>
                            <span className="admin-table__strong">{admin.name}</span>
                            <div className="small text-muted">{admin.email}</div>
                          </td>
                          <td>
                            <div className="admin-pill-row">
                              {admin.categories.map((link) => (
                                <span key={link.externalCategory.id} className="admin-pill admin-pill--feature">
                                  {link.externalCategory.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`admin-pill ${admin.isActive ? 'admin-pill--active' : 'admin-pill--inactive'}`}
                            >
                              {admin.isActive ? 'Active' : 'Banned'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-table-actions admin-table-actions--nowrap justify-content-end">
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn--edit"
                                title="Edit category access"
                                aria-label="Edit category access"
                                onClick={() => openEditCategories(admin)}
                              >
                                <i className="bi bi-pencil" aria-hidden />
                              </button>
                              <div
                                className="form-check form-switch mb-0"
                                title={admin.isActive ? 'Ban admin (blocks login)' : 'Unban admin'}
                              >
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  id={`external-admin-ban-${admin.id}`}
                                  checked={admin.isActive}
                                  disabled={toggleAdminBan.isPending}
                                  onChange={() =>
                                    toggleAdminBan.mutate({ id: admin.id, isActive: !admin.isActive })
                                  }
                                  aria-label={admin.isActive ? 'Ban external admin' : 'Unban external admin'}
                                />
                              </div>
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn--danger"
                                title="Delete admin"
                                disabled={removeAdmin.isPending}
                                onClick={() => setDeleteAdminModal({ isOpen: true, admin })}
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
        </div>
      </div>

      {editAdminModal ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={closeEditCategories}
        >
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="external-admin-edit-categories-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <h2 id="external-admin-edit-categories-title" className="admin-modal__title">
                  Edit category access
                </h2>
              </div>
              <p className="admin-modal__text small text-muted mb-3">
                <strong>{editAdminModal.name}</strong> ({editAdminModal.email})
              </p>
              <p className="small fw-semibold mb-2">External categories</p>
              {assignableCategories.length === 0 ? (
                <p className="small text-muted">No active categories available. Create one first.</p>
              ) : (
                <div className="d-flex flex-column gap-2 mb-3">
                  {assignableCategories.map((cat) => (
                    <label key={cat.id} className="d-flex align-items-center gap-2 small mb-0">
                      <input
                        type="checkbox"
                        checked={editCategoryIds.includes(cat.id)}
                        onChange={() => toggleEditCategory(cat.id)}
                        disabled={!cat.isActive && !editCategoryIds.includes(cat.id)}
                      />
                      {cat.name}
                      {!cat.isActive ? <span className="text-muted">(hidden)</span> : null}
                    </label>
                  ))}
                </div>
              )}
              {editCategoriesError ? <p className="small text-danger">{editCategoriesError}</p> : null}
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={closeEditCategories}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={updateAdminCategories.isPending || assignableCategories.length === 0}
                  onClick={saveEditCategories}
                >
                  {updateAdminCategories.isPending ? 'Saving…' : 'Save categories'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editCategoriesSuccessOpen ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={() => setEditCategoriesSuccessOpen(false)}
        >
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="external-admin-categories-saved-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body admin-modal__body--with-close">
              <button
                type="button"
                className="admin-modal__close"
                aria-label="Close"
                onClick={() => setEditCategoriesSuccessOpen(false)}
              >
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <div className="admin-modal__head">
                <i className="bi bi-check-circle-fill admin-modal__icon admin-modal__icon--success" aria-hidden />
                <h2 id="external-admin-categories-saved-title" className="admin-modal__title">Categories updated</h2>
              </div>
              <p className="admin-modal__text">
                This external admin&apos;s category access was saved. They can use new categories in Privacy and Posts.
              </p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-primary" onClick={() => setEditCategoriesSuccessOpen(false)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteAdminModal.isOpen && deleteAdminModal.admin ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={closeDeleteAdminModal}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-labelledby="external-admin-delete-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <i className="bi bi-exclamation-triangle admin-modal__icon admin-modal__icon--error" aria-hidden />
                <h2 id="external-admin-delete-title" className="admin-modal__title">
                  Delete external admin?
                </h2>
              </div>
              <p className="admin-modal__text">
                Delete external admin &ldquo;<strong>{deleteAdminModal.admin.name}</strong>&rdquo;? This cannot be
                undone.
              </p>
              <p className="admin-modal__text small text-muted mb-0">{deleteAdminModal.admin.email}</p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={closeDeleteAdminModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  disabled={removeAdmin.isPending}
                  onClick={() => removeAdmin.mutate(deleteAdminModal.admin!.id)}
                >
                  {removeAdmin.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SuperAdminLayout>
  );
};
