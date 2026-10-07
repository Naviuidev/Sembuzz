import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { externalAdminService } from '../services/external-admin.service';

export const CreateExternalAdmin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    refNum: string;
    tempPassword: string;
    adminEmail: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['super-admin', 'external', 'categories'],
    queryFn: externalAdminService.listCategories,
  });

  const activeCategories = categories.filter((c) => c.isActive);

  const createMutation = useMutation({
    mutationFn: externalAdminService.createAdmin,
    onSuccess: (response: {
      credentials?: { refNum: string; tempPassword: string; adminEmail: string };
      emailSent?: boolean;
      emailError?: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'external', 'admins'] });
      if (response.credentials) {
        setSuccessModal({
          refNum: response.credentials.refNum,
          tempPassword: response.credentials.tempPassword,
          adminEmail: response.credentials.adminEmail,
          emailSent: response.emailSent ?? false,
          emailError: response.emailError,
        });
      } else {
        navigate('/super-admin/external');
      }
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'Failed to create external admin.');
    },
  });

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !adminEmail.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (categoryIds.length === 0) {
      setError('Select at least one external category.');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      adminEmail: adminEmail.trim(),
      categoryIds,
    });
  };

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  return (
    <SuperAdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Create external admin</h1>
          <p className="admin-page-header__subtitle">
            Similar to school onboarding: assign categories and send login credentials.
          </p>
        </div>
        <Link to="/super-admin/external" className="admin-btn-secondary">
          Back to categories
        </Link>
      </div>

      <section className="admin-panel" style={{ ...panelStyle, maxWidth: 640 }}>
        <div className="admin-panel__body">
          {isLoading ? (
            <div className="admin-loading-state">Loading categories…</div>
          ) : activeCategories.length === 0 ? (
            <div className="admin-empty-state">
              <p>Create at least one active external category first.</p>
              <Link to="/super-admin/external" className="admin-btn-primary">
                Manage categories
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small fw-semibold">Admin name</label>
                <input
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="form-label small fw-semibold">Admin email</label>
                <input
                  type="email"
                  className="form-control"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="form-label small fw-semibold">External categories</label>
                <div className="d-flex flex-column gap-2">
                  {activeCategories.map((cat) => (
                    <label key={cat.id} className="d-flex align-items-center gap-2 small">
                      <input
                        type="checkbox"
                        checked={categoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>
              {error ? <p className="small text-danger mb-0">{error}</p> : null}
              <button type="submit" className="admin-btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create external admin'}
              </button>
            </form>
          )}
        </div>
      </section>

      {successModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title h5">External admin created</h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    setSuccessModal(null);
                    navigate('/super-admin/external');
                  }}
                />
              </div>
              <div className="modal-body">
                <p className="small mb-2">
                  Reference: <strong>{successModal.refNum}</strong>
                </p>
                <p className="small mb-2">
                  Email: <strong>{successModal.adminEmail}</strong>
                </p>
                <p className="small mb-2">
                  Temporary password: <code>{successModal.tempPassword}</code>
                </p>
                {successModal.emailSent ? (
                  <p className="small text-success mb-0">Onboarding email sent.</p>
                ) : (
                  <p className="small text-warning mb-0">
                    Email not sent{successModal.emailError ? `: ${successModal.emailError}` : ''}. Share credentials manually.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    setSuccessModal(null);
                    navigate('/super-admin/external');
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};
