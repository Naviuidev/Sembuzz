import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateCampaignLivePreview } from './CreateCampaignLivePreview';
import {
  EXTERNAL_CAMPAIGN_PUBLISH_STATUSES,
  EXTERNAL_CAMPAIGN_TYPES,
} from '../constants/externalCampaignOptions';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { externalAdminPostRequestsService } from '../services/external-admin-post-requests.service';
import { getApiErrorMessage } from '../utils/apiError';
import { imageSrc } from '../utils/image';

type Props = {
  categoryId: string;
  categoryName: string;
};

type PreviewSize = 'device' | 'web';

export function ExternalAdminCreateCampaignPanel({ categoryId, categoryName }: Props) {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.external } as CSSProperties;
  const queryClient = useQueryClient();
  const [previewSize, setPreviewSize] = useState<PreviewSize>('web');
  const [schoolId, setSchoolId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccessOpen, setSubmitSuccessOpen] = useState(false);

  const [campaignTitle, setCampaignTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [campaignType, setCampaignType] = useState<string>(EXTERNAL_CAMPAIGN_TYPES[0]);
  const [description, setDescription] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [locationOrOnline, setLocationOrOnline] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [postedByOrganization, setPostedByOrganization] = useState('');
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published' | 'expired'>('draft');
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['external-admin', 'post', 'schools', categoryId],
    queryFn: () => externalAdminPostRequestsService.listApprovedSchools(categoryId),
  });

  useEffect(() => {
    if (schools.length > 0 && !schoolId) setSchoolId(schools[0].id);
  }, [schools, schoolId]);

  const createMutation = useMutation({
    mutationFn: externalAdminPostRequestsService.createCampaignRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-admin', 'post-requests'] });
      setFormError(null);
      setSubmitSuccessOpen(true);
    },
    onError: (err: unknown) => setFormError(getApiErrorMessage(err, 'Failed to submit campaign.')),
  });

  const uploadFile = async (file: File, kind: 'logo' | 'banner') => {
    const setUploading = kind === 'logo' ? setLogoUploading : setBannerUploading;
    setUploading(true);
    try {
      const url = await externalAdminPostRequestsService.uploadImage(file);
      if (kind === 'logo') setCompanyLogoUrl(url);
      else setBannerImageUrl(url);
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setCampaignTitle('');
    setOrganizationName('');
    setCompanyLogoUrl('');
    setDescription('');
    setBannerImageUrl('');
    setStartDate('');
    setEndDate('');
    setTargetAudience('');
    setEligibility('');
    setLocationOrOnline('');
    setRegistrationUrl('');
    setRegistrationDeadline('');
    setContactEmail('');
    setTermsAndConditions('');
    setPostedByOrganization('');
  };

  const closeSubmitSuccess = () => {
    setSubmitSuccessOpen(false);
    createMutation.reset();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!schoolId) {
      setFormError('Select a school with approved pipeline access.');
      return;
    }
    if (
      !campaignTitle.trim() ||
      !organizationName.trim() ||
      !description.trim() ||
      !bannerImageUrl.trim() ||
      !startDate ||
      !endDate ||
      !targetAudience.trim() ||
      !eligibility.trim() ||
      !locationOrOnline.trim() ||
      !registrationUrl.trim() ||
      !postedByOrganization.trim()
    ) {
      setFormError('Fill all required campaign fields.');
      return;
    }
    createMutation.mutate(
      {
        externalCategoryId: categoryId,
        schoolId,
        campaignTitle: campaignTitle.trim(),
        organizationName: organizationName.trim(),
        companyLogoUrl: companyLogoUrl || undefined,
        campaignType,
        description: description.trim(),
        bannerImageUrl: bannerImageUrl.trim(),
        startDate,
        endDate,
        targetAudience: targetAudience.trim(),
        eligibility: eligibility.trim(),
        locationOrOnline: locationOrOnline.trim(),
        registrationUrl: registrationUrl.trim(),
        registrationDeadline: registrationDeadline || undefined,
        contactEmail: contactEmail.trim() || undefined,
        termsAndConditions: termsAndConditions.trim() || undefined,
        postedByOrganization: postedByOrganization.trim(),
        publishStatus,
      },
      { onSuccess: () => resetForm() },
    );
  };

  const previewProps = {
    campaignTitle,
    organizationName,
    companyLogoUrl,
    campaignType,
    description,
    bannerImageUrl,
    startDate,
    endDate,
    targetAudience,
    eligibility,
    locationOrOnline,
    registrationUrl,
    registrationDeadline,
    contactEmail,
    termsAndConditions,
    postedByOrganization,
    publishStatus,
    categoryName,
  };

  if (schoolsLoading) return <p className="small text-muted">Loading approved schools…</p>;
  if (schools.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>No approved schools for this category yet. Complete pipeline access under Privacy first.</p>
      </div>
    );
  }

  return (
    <div className="admin-create-post-page admin-create-post-page--embedded" style={panelStyle}>
      <div className="admin-create-post-layout admin-create-post-layout--job">
        <div className="admin-create-post-header admin-create-post-layout__header">
          <div>
            <h2 className="admin-panel__title mb-1">New campaign</h2>
            <p className="small text-muted mb-0">
              External category: <strong>{categoryName}</strong>
            </p>
          </div>
        </div>

        <form id="external-admin-create-campaign-form" className="admin-create-post-main" onSubmit={onSubmit}>
          <section className="admin-panel admin-create-post-section">
            <div className="admin-create-post-section__head">
              <span className="admin-create-post-section__num">1</span>
              <h2 className="admin-create-post-section__title">School</h2>
            </div>
            <div className="admin-panel__body">
              <label className="form-label small fw-semibold">School *</label>
              <select className="form-select form-select-sm" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="admin-panel admin-create-post-section">
            <div className="admin-create-post-section__head">
              <span className="admin-create-post-section__num">2</span>
              <h2 className="admin-create-post-section__title">Campaign details</h2>
            </div>
            <div className="admin-panel__body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Campaign title *</label>
                  <input className="form-control form-control-sm" value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Organization / company name *</label>
                  <input className="form-control form-control-sm" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Company logo</label>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button type="button" className="admin-btn-secondary admin-btn-sm" disabled={logoUploading} onClick={() => document.getElementById('external-campaign-logo')?.click()}>
                      {logoUploading ? 'Uploading…' : companyLogoUrl ? 'Change logo' : 'Upload logo'}
                    </button>
                    {companyLogoUrl ? <img src={imageSrc(companyLogoUrl)} alt="" style={{ height: 36, borderRadius: 6 }} /> : null}
                  </div>
                  <input id="external-campaign-logo" type="file" accept="image/*" className="d-none" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f, 'logo'); e.target.value = ''; }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Campaign type *</label>
                  <select className="form-select form-select-sm" value={campaignType} onChange={(e) => setCampaignType(e.target.value)}>
                    {EXTERNAL_CAMPAIGN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Detailed description *</label>
                  <textarea className="form-control form-control-sm" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Banner / cover image *</label>
                  <button type="button" className="admin-btn-secondary admin-btn-sm" disabled={bannerUploading} onClick={() => document.getElementById('external-campaign-banner')?.click()}>
                    {bannerUploading ? 'Uploading…' : bannerImageUrl ? 'Change banner' : 'Upload banner'}
                  </button>
                  <input id="external-campaign-banner" type="file" accept="image/*" className="d-none" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f, 'banner'); e.target.value = ''; }} />
                  {bannerImageUrl ? <img src={imageSrc(bannerImageUrl)} alt="" className="external-offer-preview__banner mt-2" style={{ maxHeight: 120 }} /> : null}
                </div>
              </div>
            </div>
          </section>

          <section className="admin-panel admin-create-post-section">
            <div className="admin-create-post-section__head">
              <span className="admin-create-post-section__num">3</span>
              <h2 className="admin-create-post-section__title">Schedule & audience</h2>
            </div>
            <div className="admin-panel__body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Start date *</label>
                  <input type="date" className="form-control form-control-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">End date *</label>
                  <input type="date" className="form-control form-control-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Target audience *</label>
                  <textarea className="form-control form-control-sm" rows={2} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} required />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Eligibility *</label>
                  <textarea className="form-control form-control-sm" rows={2} value={eligibility} onChange={(e) => setEligibility(e.target.value)} required />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Location / online *</label>
                  <input className="form-control form-control-sm" value={locationOrOnline} onChange={(e) => setLocationOrOnline(e.target.value)} required placeholder="e.g. Online webinar or Campus Hall A" />
                </div>
              </div>
            </div>
          </section>

          <section className="admin-panel admin-create-post-section">
            <div className="admin-create-post-section__head">
              <span className="admin-create-post-section__num">4</span>
              <h2 className="admin-create-post-section__title">Registration</h2>
            </div>
            <div className="admin-panel__body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Registration URL *</label>
                  <input className="form-control form-control-sm" value={registrationUrl} onChange={(e) => setRegistrationUrl(e.target.value)} required placeholder="https://…" />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Registration deadline</label>
                  <input type="date" className="form-control form-control-sm" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Contact email</label>
                  <input type="email" className="form-control form-control-sm" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Terms & conditions</label>
                  <textarea className="form-control form-control-sm" rows={3} value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Posted by / organization *</label>
                  <input className="form-control form-control-sm" value={postedByOrganization} onChange={(e) => setPostedByOrganization(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Status *</label>
                  <select className="form-select form-select-sm" value={publishStatus} onChange={(e) => setPublishStatus(e.target.value as 'draft' | 'published' | 'expired')}>
                    {EXTERNAL_CAMPAIGN_PUBLISH_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
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
              <CreateCampaignLivePreview {...previewProps} layoutVariant={previewSize} />
            </div>
            <div className="admin-create-post-tip">
              <i className="bi bi-lightbulb" aria-hidden />
              Description preview shows 15 words plus Know more. School admin reviews campaigns under External config → Post approval.
            </div>
          </div>
        </aside>
      </div>

      <div className="admin-create-post-footer" style={panelStyle}>
        <p className="small text-muted mb-0 d-none d-xl-block flex-grow-1">Submitted campaigns are reviewed by the school admin.</p>
        <div className="admin-create-post-footer__actions">
          <button type="submit" form="external-admin-create-campaign-form" className="admin-btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Submitting…' : 'Submit campaign for review'}
          </button>
        </div>
      </div>

      {submitSuccessOpen ? (
        <div className="admin-modal-overlay admin-modal-overlay--elevated" role="presentation" onClick={closeSubmitSuccess}>
          <div className="admin-modal admin-modal--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__body admin-modal__body--with-close">
              <button type="button" className="admin-modal__close" aria-label="Close" onClick={closeSubmitSuccess}>
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <div className="admin-modal__head">
                <i className="bi bi-check-circle-fill admin-modal__icon admin-modal__icon--success" aria-hidden />
                <h2 className="admin-modal__title">Sent for school admin approval</h2>
              </div>
              <p className="admin-modal__text">Your campaign was submitted. The school admin will review and can approve, reject, or send a query.</p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-primary" onClick={closeSubmitSuccess}>OK</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
