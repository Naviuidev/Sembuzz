import { useMemo, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { StatusPopup } from '../components/StatusPopup';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  MASTER_ADMIN_PORTAL_SECTION_OPTIONS,
  type MasterAdminPortalSectionId,
} from '../constants/masterAdminPortalSections';
import { masterAdminDeveloperLayerService } from '../services/master-admin-developer-layer.service';
import { masterAdminSchoolsService } from '../services/master-admin-schools.service';
import { imageSrc } from '../utils/image';
import { getApiErrorMessage } from '../utils/apiError';

type WizardStep = 'email' | 'profile' | 'features';

const ACTION_OPTIONS = [{ id: 'provide-access', label: 'Provide access' }] as const;
const ACCESS_OPTIONS = [
  { id: 'email' as const, label: 'Email access' },
  { id: 'sso' as const, label: 'SSO access (coming soon)' },
];

export const MasterAdminDeveloperLayerPage = () => {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const queryClient = useQueryClient();

  const [action, setAction] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [accessMethod, setAccessMethod] = useState<'' | 'email' | 'sso'>('');
  const [adminsPanelOpen, setAdminsPanelOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('email');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [selectedSections, setSelectedSections] = useState<MasterAdminPortalSectionId[]>(['dashboard', 'schools']);
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: '',
  });

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: masterAdminSchoolsService.list,
  });

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);

  const { data: admins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['master-admin', 'developer-layer', 'admins'],
    queryFn: masterAdminDeveloperLayerService.listAdmins,
  });

  const selectedSchool = useMemo(() => schoolOptions.find((s) => s.id === schoolId), [schoolOptions, schoolId]);

  const handleSchoolChange = (nextId: string) => {
    setSchoolId(nextId);
    setAction('');
    setAccessMethod('');
  };

  const handleActionChange = (next: string) => {
    setAction(next);
    setAccessMethod('');
  };

  const provisionMutation = useMutation({
    mutationFn: () =>
      masterAdminDeveloperLayerService.provision({
        schoolId,
        accessMethod: accessMethod as 'email' | 'sso',
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        verificationDocumentUrl: docUrl ?? undefined,
        allowedPortalSections: selectedSections,
      }),
    onSuccess: () => {
      setPopup({ show: true, type: 'success', message: 'Access provisioned. Onboarding email sent with a temporary password.' });
      setWizardOpen(false);
      setWizardStep('email');
      setEmail('');
      setFirstName('');
      setLastName('');
      setDocUrl(null);
      void queryClient.invalidateQueries({ queryKey: ['master-admin', 'developer-layer', 'admins'] });
    },
    onError: (err: unknown) => {
      setPopup({ show: true, type: 'error', message: getApiErrorMessage(err, 'Could not provision access.') });
    },
  });

  const openWizard = () => {
    if (!schoolId || !action || !accessMethod) {
      setPopup({ show: true, type: 'error', message: 'Complete school, action, and access type first.' });
      return;
    }
    if (accessMethod === 'sso') {
      setPopup({ show: true, type: 'error', message: 'SSO access is not available yet. Choose email access.' });
      return;
    }
    setWizardOpen(true);
    setWizardStep('email');
  };

  const toggleSection = (id: MasterAdminPortalSectionId) => {
    setSelectedSections((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDocPick = async (file: File | null) => {
    if (!file) return;
    setDocUploading(true);
    try {
      const { url } = await masterAdminDeveloperLayerService.uploadDocument(file);
      setDocUrl(url);
    } catch (err: unknown) {
      setPopup({ show: true, type: 'error', message: getApiErrorMessage(err, 'Upload failed.') });
    } finally {
      setDocUploading(false);
    }
  };

  return (
    <MasterAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            <h1 className="admin-page-title mb-1">Developer layer</h1>
            <p className="admin-page-subtitle mb-0">
              Select a school, then choose action and access type to provision a school master admin.
            </p>
          </div>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => setAdminsPanelOpen(true)}
            aria-haspopup="dialog"
          >
            <i className="bi bi-people me-2" aria-hidden />
            School master admins
            {admins.length > 0 ? (
              <span className="admin-pill admin-pill--neutral ms-2 mb-0">{admins.length}</span>
            ) : null}
          </button>
        </div>
      </header>

      <section className="admin-panel master-admin-posts-school-filter" style={panelStyle}>
        <div className="admin-panel__body">
          <label className="admin-form-label" htmlFor="dl-school">
            Select school
          </label>
          <select
            id="dl-school"
            className="form-select admin-form-control master-admin-posts-school-filter__select"
            value={schoolId}
            onChange={(e) => handleSchoolChange(e.target.value)}
            disabled={schoolsLoading}
          >
            <option value="">Choose school…</option>
            {schoolOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {schoolId ? (
            <>
              <label className="admin-form-label" htmlFor="dl-action">
                Action
              </label>
              <select
                id="dl-action"
                className="form-select admin-form-control master-admin-posts-school-filter__select"
                value={action}
                onChange={(e) => handleActionChange(e.target.value)}
              >
                <option value="">Choose action…</option>
                {ACTION_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {schoolId && action ? (
            <>
              <label className="admin-form-label" htmlFor="dl-access">
                Access type
              </label>
              <select
                id="dl-access"
                className="form-select admin-form-control master-admin-posts-school-filter__select"
                value={accessMethod}
                onChange={(e) => setAccessMethod(e.target.value as '' | 'email' | 'sso')}
              >
                <option value="">Choose access type…</option>
                {ACCESS_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {schoolId && action && accessMethod ? (
            <button type="button" className="admin-btn-primary" onClick={openWizard}>
              Continue
            </button>
          ) : null}
        </div>
      </section>

      {adminsPanelOpen ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setAdminsPanelOpen(false)}>
          <div
            className="admin-modal admin-modal--lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dl-admins-title"
            onClick={(e) => e.stopPropagation()}
            style={panelStyle}
          >
            <div className="admin-modal__header">
              <h2 id="dl-admins-title" className="admin-modal__title">
                School master admins
              </h2>
              <button
                type="button"
                className="admin-modal__close"
                aria-label="Close"
                onClick={() => setAdminsPanelOpen(false)}
              >
                <i className="bi bi-x-lg" aria-hidden />
              </button>
            </div>
            <div className="admin-modal__body admin-table-responsive">
              {adminsLoading ? (
                <p className="master-admin-detail-muted mb-0">Loading…</p>
              ) : admins.length === 0 ? (
                <p className="master-admin-detail-muted mb-0">No school master admins provisioned yet.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>School</th>
                      <th>Access</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.firstName} {row.lastName}
                        </td>
                        <td>{row.email}</td>
                        <td>{row.school.name}</td>
                        <td className="text-capitalize">{row.accessMethod}</td>
                        <td>{row.isFirstLogin ? 'Awaiting first login' : 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {wizardOpen ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setWizardOpen(false)}>
          <div
            className="admin-modal admin-modal--md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dl-wizard-title"
            onClick={(e) => e.stopPropagation()}
            style={panelStyle}
          >
            <div className="admin-modal__header">
              <h2 id="dl-wizard-title" className="admin-modal__title">
                {wizardStep === 'email' && 'Admin email'}
                {wizardStep === 'profile' && 'Admin profile'}
                {wizardStep === 'features' && 'Sidebar access'}
              </h2>
              <button type="button" className="admin-modal__close" aria-label="Close" onClick={() => setWizardOpen(false)}>
                <i className="bi bi-x-lg" aria-hidden />
              </button>
            </div>
            <div className="admin-modal__body">
              {wizardStep === 'email' ? (
                <>
                  <p className="admin-form-hint">Enter the school master admin email. They will sign in with this address.</p>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.edu"
                    autoComplete="email"
                  />
                </>
              ) : null}

              {wizardStep === 'profile' && selectedSchool ? (
                <>
                  <p className="admin-form-hint mb-3">
                    School: <strong>{selectedSchool.name}</strong> · Ref <code>{selectedSchool.refNum}</code>
                  </p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First name</label>
                      <input className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last name</label>
                      <input className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 mt-3 mb-3">
                    <span className="master-admin-school-card__logo" aria-hidden>
                      {selectedSchool.image ? (
                        <img src={imageSrc(selectedSchool.image)} alt="" />
                      ) : (
                        <i className="bi bi-building" />
                      )}
                    </span>
                    <span className="admin-detail-value mb-0">{selectedSchool.name}</span>
                  </div>
                  <label className="form-label">Verification document (image or PDF)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    disabled={docUploading}
                    onChange={(e) => void handleDocPick(e.target.files?.[0] ?? null)}
                  />
                  {docUrl ? <p className="admin-form-hint mt-2 mb-0">Uploaded.</p> : null}
                </>
              ) : null}

              {wizardStep === 'features' ? (
                <>
                  <p className="admin-form-hint">Choose which master admin sidebar areas this user can open (for this school only).</p>
                  <div className="d-flex flex-column gap-2 mt-2">
                    {MASTER_ADMIN_PORTAL_SECTION_OPTIONS.map((opt) => (
                      <label key={opt.id} className="d-flex align-items-center gap-2 mb-0">
                        <input
                          type="checkbox"
                          checked={selectedSections.includes(opt.id)}
                          onChange={() => toggleSection(opt.id)}
                        />
                        <i className={`bi ${opt.icon}`} aria-hidden />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <div className="admin-modal__footer d-flex justify-content-between gap-2">
              <button type="button" className="admin-btn-secondary" onClick={() => setWizardOpen(false)}>
                Cancel
              </button>
              <div className="d-flex gap-2">
                {wizardStep !== 'email' ? (
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setWizardStep(wizardStep === 'features' ? 'profile' : 'email')}
                  >
                    Back
                  </button>
                ) : null}
                {wizardStep === 'email' ? (
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={!email.trim()}
                    onClick={() => setWizardStep('profile')}
                  >
                    Next
                  </button>
                ) : null}
                {wizardStep === 'profile' ? (
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={!firstName.trim() || !lastName.trim()}
                    onClick={() => setWizardStep('features')}
                  >
                    Next
                  </button>
                ) : null}
                {wizardStep === 'features' ? (
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={selectedSections.length === 0 || provisionMutation.isPending}
                    onClick={() => provisionMutation.mutate()}
                  >
                    {provisionMutation.isPending ? 'Processing…' : 'Process'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <StatusPopup
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup((p) => ({ ...p, show: false }))}
      />
    </MasterAdminLayout>
  );
};
