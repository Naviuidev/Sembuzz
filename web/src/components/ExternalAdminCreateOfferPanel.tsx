import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateOfferLivePreview } from './CreateOfferLivePreview';
import { EXTERNAL_OFFER_CATEGORIES, EXTERNAL_OFFER_PUBLISH_STATUSES } from '../constants/externalOfferOptions';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { externalAdminPostRequestsService } from '../services/external-admin-post-requests.service';
import { getApiErrorMessage } from '../utils/apiError';
import { imageSrc } from '../utils/image';

type Props = {
  categoryId: string;
  categoryName: string;
};

type PreviewSize = 'device' | 'web';

export function ExternalAdminCreateOfferPanel({ categoryId, categoryName }: Props) {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.external } as CSSProperties;
  const queryClient = useQueryClient();
  const [previewSize, setPreviewSize] = useState<PreviewSize>('web');
  const [schoolId, setSchoolId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccessOpen, setSubmitSuccessOpen] = useState(false);

  const [offerTitle, setOfferTitle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [offerCategory, setOfferCategory] = useState<string>(EXTERNAL_OFFER_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [offerPriceDiscount, setOfferPriceDiscount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [howToRedeem, setHowToRedeem] = useState('');
  const [redemptionUrl, setRedemptionUrl] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [postedByOrganization, setPostedByOrganization] = useState('');
  const [offerPublishStatus, setOfferPublishStatus] = useState<'draft' | 'published' | 'expired'>('draft');
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
    mutationFn: externalAdminPostRequestsService.createOfferRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-admin', 'post-requests'] });
      setFormError(null);
      setSubmitSuccessOpen(true);
    },
    onError: (err: unknown) => setFormError(getApiErrorMessage(err, 'Failed to submit offer.')),
  });

  const uploadFile = async (file: File, kind: 'logo' | 'banner') => {
    const setUploading = kind === 'logo' ? setLogoUploading : setBannerUploading;
    setUploading(true);
    try {
      const url = await externalAdminPostRequestsService.uploadImage(file);
      if (kind === 'logo') setBrandLogoUrl(url);
      else setBannerImageUrl(url);
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setOfferTitle('');
    setBrandName('');
    setBrandLogoUrl('');
    setDescription('');
    setBannerImageUrl('');
    setOriginalPrice('');
    setOfferPriceDiscount('');
    setCouponCode('');
    setValidFrom('');
    setValidUntil('');
    setEligibility('');
    setHowToRedeem('');
    setRedemptionUrl('');
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
      !offerTitle.trim() ||
      !brandName.trim() ||
      !description.trim() ||
      !bannerImageUrl.trim() ||
      !offerPriceDiscount.trim() ||
      !validFrom ||
      !validUntil ||
      !eligibility.trim() ||
      !howToRedeem.trim() ||
      !redemptionUrl.trim() ||
      !termsAndConditions.trim() ||
      !postedByOrganization.trim()
    ) {
      setFormError('Fill all required offer fields.');
      return;
    }
    createMutation.mutate(
      {
        externalCategoryId: categoryId,
        schoolId,
        offerTitle: offerTitle.trim(),
        brandName: brandName.trim(),
        brandLogoUrl: brandLogoUrl || undefined,
        offerCategory,
        description: description.trim(),
        bannerImageUrl: bannerImageUrl.trim(),
        originalPrice: originalPrice.trim() || undefined,
        offerPriceDiscount: offerPriceDiscount.trim(),
        couponCode: couponCode.trim() || undefined,
        validFrom,
        validUntil,
        eligibility: eligibility.trim(),
        howToRedeem: howToRedeem.trim(),
        redemptionUrl: redemptionUrl.trim(),
        termsAndConditions: termsAndConditions.trim(),
        postedByOrganization: postedByOrganization.trim(),
        offerPublishStatus,
      },
      { onSuccess: () => resetForm() },
    );
  };

  const previewProps = {
    offerTitle,
    brandName,
    brandLogoUrl,
    offerCategory,
    description,
    bannerImageUrl,
    originalPrice,
    offerPriceDiscount,
    couponCode,
    validFrom,
    validUntil,
    eligibility,
    howToRedeem,
    redemptionUrl,
    termsAndConditions,
    postedByOrganization,
    offerPublishStatus,
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
            <h2 className="admin-panel__title mb-1">New offer</h2>
            <p className="small text-muted mb-0">
              External category: <strong>{categoryName}</strong>
            </p>
          </div>
        </div>

        <form id="external-admin-create-offer-form" className="admin-create-post-main" onSubmit={onSubmit}>
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
              <h2 className="admin-create-post-section__title">Offer details</h2>
            </div>
            <div className="admin-panel__body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Offer title *</label>
                  <input className="form-control form-control-sm" value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Brand / company name *</label>
                  <input className="form-control form-control-sm" value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Brand logo</label>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button type="button" className="admin-btn-secondary admin-btn-sm" disabled={logoUploading} onClick={() => document.getElementById('external-offer-logo')?.click()}>
                      {logoUploading ? 'Uploading…' : brandLogoUrl ? 'Change logo' : 'Upload logo'}
                    </button>
                    {brandLogoUrl ? <img src={imageSrc(brandLogoUrl)} alt="" style={{ height: 36, borderRadius: 6 }} /> : null}
                  </div>
                  <input id="external-offer-logo" type="file" accept="image/*" className="d-none" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f, 'logo'); e.target.value = ''; }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Offer category *</label>
                  <select className="form-select form-select-sm" value={offerCategory} onChange={(e) => setOfferCategory(e.target.value)}>
                    {EXTERNAL_OFFER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Detailed description *</label>
                  <textarea className="form-control form-control-sm" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Offer image / banner *</label>
                  <button type="button" className="admin-btn-secondary admin-btn-sm" disabled={bannerUploading} onClick={() => document.getElementById('external-offer-banner')?.click()}>
                    {bannerUploading ? 'Uploading…' : bannerImageUrl ? 'Change banner' : 'Upload banner'}
                  </button>
                  <input id="external-offer-banner" type="file" accept="image/*" className="d-none" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f, 'banner'); e.target.value = ''; }} />
                  {bannerImageUrl ? <img src={imageSrc(bannerImageUrl)} alt="" className="external-offer-preview__banner mt-2" style={{ maxHeight: 120 }} /> : null}
                </div>
              </div>
            </div>
          </section>

          <section className="admin-panel admin-create-post-section">
            <div className="admin-create-post-section__head">
              <span className="admin-create-post-section__num">3</span>
              <h2 className="admin-create-post-section__title">Pricing & validity</h2>
            </div>
            <div className="admin-panel__body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Original price</label>
                  <input className="form-control form-control-sm" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="e.g. ₹999" />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Offer price / discount *</label>
                  <input className="form-control form-control-sm" value={offerPriceDiscount} onChange={(e) => setOfferPriceDiscount(e.target.value)} required placeholder="e.g. 50% off or ₹499" />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Coupon code</label>
                  <input className="form-control form-control-sm" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Valid from *</label>
                  <input type="date" className="form-control form-control-sm" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Valid until *</label>
                  <input type="date" className="form-control form-control-sm" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
                </div>
              </div>
            </div>
          </section>

          <section className="admin-panel admin-create-post-section">
            <div className="admin-create-post-section__head">
              <span className="admin-create-post-section__num">4</span>
              <h2 className="admin-create-post-section__title">Redemption</h2>
            </div>
            <div className="admin-panel__body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Eligibility *</label>
                  <textarea className="form-control form-control-sm" rows={2} value={eligibility} onChange={(e) => setEligibility(e.target.value)} required />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">How to redeem *</label>
                  <textarea className="form-control form-control-sm" rows={2} value={howToRedeem} onChange={(e) => setHowToRedeem(e.target.value)} required />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Redemption URL *</label>
                  <input className="form-control form-control-sm" value={redemptionUrl} onChange={(e) => setRedemptionUrl(e.target.value)} required placeholder="https://…" />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Terms & conditions *</label>
                  <textarea className="form-control form-control-sm" rows={3} value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Posted by / organization *</label>
                  <input className="form-control form-control-sm" value={postedByOrganization} onChange={(e) => setPostedByOrganization(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Status *</label>
                  <select className="form-select form-select-sm" value={offerPublishStatus} onChange={(e) => setOfferPublishStatus(e.target.value as 'draft' | 'published' | 'expired')}>
                    {EXTERNAL_OFFER_PUBLISH_STATUSES.map((s) => (
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
              <CreateOfferLivePreview {...previewProps} layoutVariant={previewSize} />
            </div>
            <div className="admin-create-post-tip">
              <i className="bi bi-lightbulb" aria-hidden />
              Description preview shows 15 words plus Know more. School admin reviews offers under External config → Post approval.
            </div>
          </div>
        </aside>
      </div>

      <div className="admin-create-post-footer" style={panelStyle}>
        <p className="small text-muted mb-0 d-none d-xl-block flex-grow-1">Submitted offers are reviewed by the school admin.</p>
        <div className="admin-create-post-footer__actions">
          <button type="submit" form="external-admin-create-offer-form" className="admin-btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Submitting…' : 'Submit offer for review'}
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
              <p className="admin-modal__text">Your offer was submitted. The school admin will review and can approve, reject, or send a query.</p>
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
