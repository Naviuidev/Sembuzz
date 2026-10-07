import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateJobLivePreview } from './CreateJobLivePreview';
import {
  EXTERNAL_EXPERIENCE_LEVELS,
  EXTERNAL_JOB_PUBLISH_STATUSES,
  EXTERNAL_JOB_TYPES,
  EXTERNAL_WORK_MODES,
  isExternalJobShareCategory,
} from '../constants/externalJobOptions';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { externalAdminPostRequestsService } from '../services/external-admin-post-requests.service';
import { getApiErrorMessage } from '../utils/apiError';
import { imageSrc } from '../utils/image';

type Props = {
  categoryId: string;
  categoryName: string;
};

type PreviewSize = 'device' | 'web';

export function ExternalAdminCreateJobPanel({ categoryId, categoryName }: Props) {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.external } as CSSProperties;
  const queryClient = useQueryClient();
  const [previewSize, setPreviewSize] = useState<PreviewSize>('web');
  const [schoolId, setSchoolId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [jobType, setJobType] = useState<string>(EXTERNAL_JOB_TYPES[0]);
  const [workMode, setWorkMode] = useState<string>(EXTERNAL_WORK_MODES[0]);
  const [location, setLocation] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [eligibilityRequirements, setEligibilityRequirements] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [experienceRequired, setExperienceRequired] = useState<string>(EXTERNAL_EXPERIENCE_LEVELS[0]);
  const [salaryStipend, setSalaryStipend] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [applicationMethod, setApplicationMethod] = useState<'external_url' | 'email'>('external_url');
  const [applicationTarget, setApplicationTarget] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [postedByOrganization, setPostedByOrganization] = useState('');
  const [jobPublishStatus, setJobPublishStatus] = useState<'draft' | 'published' | 'closed'>('draft');
  const [applyButtonEnabled, setApplyButtonEnabled] = useState(true);
  const [saveJobButtonEnabled, setSaveJobButtonEnabled] = useState(true);
  const [applyButtonUrl, setApplyButtonUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [submitSuccessOpen, setSubmitSuccessOpen] = useState(false);

  const isJobShareCategory = useMemo(() => isExternalJobShareCategory(categoryName), [categoryName]);
  const showApplySaveOptions = isJobShareCategory;
  const effectiveApplyEnabled = showApplySaveOptions && applyButtonEnabled;
  const effectiveSaveEnabled = showApplySaveOptions && saveJobButtonEnabled;

  useEffect(() => {
    if (!isJobShareCategory) {
      setApplyButtonEnabled(false);
      setSaveJobButtonEnabled(false);
      setApplyButtonUrl('');
    } else {
      setApplyButtonEnabled(true);
      setSaveJobButtonEnabled(true);
    }
  }, [categoryId, isJobShareCategory]);

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['external-admin', 'post', 'schools', categoryId],
    queryFn: () => externalAdminPostRequestsService.listApprovedSchools(categoryId),
  });

  useEffect(() => {
    if (schools.length > 0 && !schoolId) setSchoolId(schools[0].id);
  }, [schools, schoolId]);

  const createMutation = useMutation({
    mutationFn: externalAdminPostRequestsService.createJobRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-admin', 'post-requests'] });
      setFormError(null);
      setSubmitSuccessOpen(true);
    },
    onError: (err: unknown) => setFormError(getApiErrorMessage(err, 'Failed to submit job.')),
  });

  const onLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const url = await externalAdminPostRequestsService.uploadImage(file);
      setCompanyLogoUrl(url);
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, 'Logo upload failed.'));
    } finally {
      setLogoUploading(false);
    }
  };

  const resetForm = () => {
    setJobTitle('');
    setCompanyName('');
    setCompanyLogoUrl('');
    setLocation('');
    setJobDescription('');
    setEligibilityRequirements('');
    setSkillsRequired('');
    setSalaryStipend('');
    setApplicationDeadline('');
    setApplicationTarget('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setPostedByOrganization('');
    setApplyButtonUrl('');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!schoolId) {
      setFormError('Select a school with approved pipeline access.');
      return;
    }
    if (!jobTitle.trim() || !companyName.trim() || !location.trim() || !jobDescription.trim()) {
      setFormError('Fill all required job fields.');
      return;
    }
    if (effectiveApplyEnabled && !applyButtonUrl.trim()) {
      setFormError('Paste the apply button redirection link when Apply is enabled.');
      return;
    }
    createMutation.mutate(
      {
        externalCategoryId: categoryId,
        schoolId,
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        companyLogoUrl: companyLogoUrl || undefined,
        jobType,
        workMode,
        location: location.trim(),
        jobDescription: jobDescription.trim(),
        eligibilityRequirements: eligibilityRequirements.trim(),
        skillsRequired: skillsRequired.trim(),
        experienceRequired,
        salaryStipend: salaryStipend.trim(),
        applicationDeadline,
        applicationMethod,
        applicationTarget: applicationTarget.trim(),
        contactPerson: contactPerson.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        postedByOrganization: postedByOrganization.trim(),
        jobPublishStatus,
        applyButtonEnabled: effectiveApplyEnabled,
        saveJobButtonEnabled: effectiveSaveEnabled,
        applyButtonUrl: effectiveApplyEnabled ? applyButtonUrl.trim() : undefined,
      },
      { onSuccess: () => resetForm() },
    );
  };

  const closeSubmitSuccess = () => {
    setSubmitSuccessOpen(false);
    createMutation.reset();
  };

  if (schoolsLoading) {
    return <p className="small text-muted">Loading approved schools…</p>;
  }
  if (schools.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>No approved schools for this category yet. Complete pipeline access under Privacy first.</p>
      </div>
    );
  }

  const toggleBar = (
    <div className="external-job-compose-bar">
      <div className="form-check form-switch mb-0">
        <input
          className="form-check-input"
          type="checkbox"
          id="externalJobApplyToggle"
          checked={applyButtonEnabled}
          onChange={(e) => setApplyButtonEnabled(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="externalJobApplyToggle">Apply button</label>
      </div>
      <div className="form-check form-switch mb-0">
        <input
          className="form-check-input"
          type="checkbox"
          id="externalJobSaveToggle"
          checked={saveJobButtonEnabled}
          onChange={(e) => setSaveJobButtonEnabled(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="externalJobSaveToggle">Save job button</label>
      </div>
    </div>
  );

  return (
    <div className="admin-create-post-page admin-create-post-page--embedded" style={panelStyle}>
      <div className="admin-create-post-layout admin-create-post-layout--job">
        <div className="admin-create-post-header admin-create-post-layout__header external-job-compose-header">
          <div>
            <h2 className="admin-panel__title mb-1">New job</h2>
            <p className="small text-muted mb-0">
              External category: <strong>{categoryName}</strong>
            </p>
          </div>
          {showApplySaveOptions ? toggleBar : null}
        </div>

        <form id="external-admin-create-job-form" className="admin-create-post-main" onSubmit={onSubmit}>
          <section className="admin-panel admin-create-post-section">
            <div className="admin-create-post-section__head">
              <span className="admin-create-post-section__num">1</span>
              <h2 className="admin-create-post-section__title">School</h2>
            </div>
            <div className="admin-panel__body">
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label small fw-semibold">School *</label>
                <select className="form-select form-select-sm" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                  ))}
                </select>
                <p className="small text-muted mt-2 mb-0">The school admin reviews and approves jobs for this campus.</p>
              </div>
            </div>
            </div>
          </section>

          <section className="admin-panel admin-create-post-section">
            <div className="admin-create-post-section__head">
              <span className="admin-create-post-section__num">2</span>
              <h2 className="admin-create-post-section__title">Job details</h2>
            </div>
            <div className="admin-panel__body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Job title *</label>
                <input className="form-control form-control-sm" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Company name *</label>
                <input className="form-control form-control-sm" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Company logo</label>
                <div className="admin-create-post-upload-zone">
                  <button
                    type="button"
                    className="admin-btn-secondary admin-btn-sm"
                    disabled={logoUploading}
                    onClick={() => document.getElementById('external-job-logo-input')?.click()}
                  >
                    {logoUploading ? 'Uploading…' : companyLogoUrl ? 'Change logo' : 'Upload logo'}
                  </button>
                  <input
                    id="external-job-logo-input"
                    type="file"
                    accept="image/*"
                    className="admin-create-post-file-input"
                    tabIndex={-1}
                    aria-hidden
                    disabled={logoUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onLogoUpload(f);
                      e.target.value = '';
                    }}
                  />
                  {companyLogoUrl ? (
                    <div className="admin-create-post-upload-thumbs mt-2">
                      <img src={imageSrc(companyLogoUrl)} alt="Company logo preview" />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Job type *</label>
                <select className="form-select form-select-sm" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                  {EXTERNAL_JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Work mode *</label>
                <select className="form-select form-select-sm" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                  {EXTERNAL_WORK_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Location *</label>
                <input className="form-control form-control-sm" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Job description *</label>
                <textarea className="form-control form-control-sm" rows={4} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} required />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Eligibility / requirements *</label>
                <textarea className="form-control form-control-sm" rows={3} value={eligibilityRequirements} onChange={(e) => setEligibilityRequirements(e.target.value)} required />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Skills required *</label>
                <textarea className="form-control form-control-sm" rows={2} value={skillsRequired} onChange={(e) => setSkillsRequired(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Experience required *</label>
                <select className="form-select form-select-sm" value={experienceRequired} onChange={(e) => setExperienceRequired(e.target.value)}>
                  {EXTERNAL_EXPERIENCE_LEVELS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Salary / stipend *</label>
                <input className="form-control form-control-sm" value={salaryStipend} onChange={(e) => setSalaryStipend(e.target.value)} required />
              </div>
            </div>
            </div>
          </section>

          <section className="admin-panel admin-create-post-section">
            <div className="admin-create-post-section__head">
              <span className="admin-create-post-section__num">3</span>
              <h2 className="admin-create-post-section__title">Application & contacts</h2>
            </div>
            <div className="admin-panel__body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Application deadline *</label>
                <input type="date" className="form-control form-control-sm" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Application method *</label>
                <select
                  className="form-select form-select-sm"
                  value={applicationMethod}
                  onChange={(e) => setApplicationMethod(e.target.value as 'external_url' | 'email')}
                >
                  <option value="external_url">External URL</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Application URL / email *</label>
                <input
                  className="form-control form-control-sm"
                  value={applicationTarget}
                  onChange={(e) => setApplicationTarget(e.target.value)}
                  placeholder={applicationMethod === 'email' ? 'careers@company.com' : 'https://…'}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Contact person</label>
                <input className="form-control form-control-sm" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Contact email</label>
                <input type="email" className="form-control form-control-sm" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Contact phone</label>
                <input className="form-control form-control-sm" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Posted by / organization *</label>
                <input className="form-control form-control-sm" value={postedByOrganization} onChange={(e) => setPostedByOrganization(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Status *</label>
                <select
                  className="form-select form-select-sm"
                  value={jobPublishStatus}
                  onChange={(e) => setJobPublishStatus(e.target.value as 'draft' | 'published' | 'closed')}
                >
                  {EXTERNAL_JOB_PUBLISH_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              {effectiveApplyEnabled ? (
                <div className="col-12">
                  <label className="form-label small fw-semibold">Apply now URL *</label>
                  <input
                    className="form-control form-control-sm external-job-apply-url-field"
                    value={applyButtonUrl}
                    onChange={(e) => setApplyButtonUrl(e.target.value)}
                    placeholder="https://careers.example.com/apply/role-id"
                    required
                  />
                  <p className="small text-muted mb-0 mt-1">Students use this link when they tap Apply now.</p>
                </div>
              ) : null}
            </div>
            </div>
          </section>
          {formError ? <p className="small text-danger px-1">{formError}</p> : null}
        </form>

        <aside className="admin-create-post-preview-col">
          <div className="admin-create-post-preview-card">
            <p className="small fw-semibold text-muted mb-2">Live preview</p>
            <div className="admin-create-post-preview-toggle" role="tablist" aria-label="Preview size">
              <button type="button" className={previewSize === 'web' ? 'is-active' : ''} onClick={() => setPreviewSize('web')}>Web</button>
              <button type="button" className={previewSize === 'device' ? 'is-active' : ''} onClick={() => setPreviewSize('device')}>Mobile</button>
            </div>
            <div className="admin-create-post-preview-stage">
            <CreateJobLivePreview
              jobTitle={jobTitle}
              companyName={companyName}
              companyLogoUrl={companyLogoUrl}
              jobType={jobType}
              workMode={workMode}
              location={location}
              jobDescription={jobDescription}
              eligibilityRequirements={eligibilityRequirements}
              skillsRequired={skillsRequired}
              experienceRequired={experienceRequired}
              salaryStipend={salaryStipend}
              applicationDeadline={applicationDeadline}
              applicationMethod={applicationMethod}
              applicationTarget={applicationTarget}
              contactPerson={contactPerson}
              contactEmail={contactEmail}
              contactPhone={contactPhone}
              postedByOrganization={postedByOrganization}
              applyButtonEnabled={effectiveApplyEnabled}
              saveJobButtonEnabled={effectiveSaveEnabled}
              categoryName={categoryName}
              layoutVariant={previewSize}
            />
            </div>
            <div className="admin-create-post-tip">
              <i className="bi bi-lightbulb" aria-hidden />
              {showApplySaveOptions
                ? 'Enable Apply above and set the Apply now URL in the form. Description preview shows 15 words plus Know more.'
                : 'Description preview shows 15 words plus Know more. Apply and Save job buttons are only for the JobShare category.'}
            </div>
          </div>
        </aside>
      </div>

      <div className="admin-create-post-footer" style={panelStyle}>
        <p className="small text-muted mb-0 d-none d-xl-block flex-grow-1">
          Jobs are sent to the school admin for review (approve, reject, or query). Subcategory admin is not involved.
        </p>
        <div className="admin-create-post-footer__actions">
          <button type="submit" form="external-admin-create-job-form" className="admin-btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Submitting…' : 'Submit job for review'}
          </button>
        </div>
      </div>

      {submitSuccessOpen ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={closeSubmitSuccess}
        >
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="external-job-submit-success-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body admin-modal__body--with-close">
              <button
                type="button"
                className="admin-modal__close"
                aria-label="Close"
                onClick={closeSubmitSuccess}
              >
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <div className="admin-modal__head">
                <i className="bi bi-check-circle-fill admin-modal__icon admin-modal__icon--success" aria-hidden />
                <h2 id="external-job-submit-success-title" className="admin-modal__title">Sent for school admin approval</h2>
              </div>
              <p className="admin-modal__text">
                Your job post was submitted successfully. The school admin will review it and can approve, reject, or send a query.
              </p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={closeSubmitSuccess}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
