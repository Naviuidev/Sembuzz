import { useState, useRef, type CSSProperties } from 'react';
import { AdsAdminLayout } from '../components/AdsAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { adsAdminBannerAdsService } from '../services/ads-admin-banner-ads.service';
import { adsAdminSponsoredAdsService } from '../services/ads-admin-sponsored-ads.service';
import { cstDatetimeLocalStringToUTC } from '../utils/cst-date';

type AdsMode = 'hub' | 'banner' | 'sponsored';

export const AdsAdminAds = () => {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.ads } as CSSProperties;
  const [mode, setMode] = useState<AdsMode>('hub');

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [externalLink, setExternalLink] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sponsoredTitle, setSponsoredTitle] = useState('');
  const [sponsoredDescription, setSponsoredDescription] = useState('');
  const [sponsoredImageFiles, setSponsoredImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [sponsoredImagePreviews, setSponsoredImagePreviews] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [sponsoredExternalLink, setSponsoredExternalLink] = useState('');
  const [sponsoredStartAt, setSponsoredStartAt] = useState('');
  const [sponsoredEndAt, setSponsoredEndAt] = useState('');
  const [sponsoredUploading, setSponsoredUploading] = useState(false);
  const [sponsoredSubmitting, setSponsoredSubmitting] = useState(false);
  const sponsoredFileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    resetMessages();
    if (bannerPreviewUrl) {
      URL.revokeObjectURL(bannerPreviewUrl);
      setBannerPreviewUrl(null);
    }
    if (!file) {
      setBannerFile(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image (JPEG, PNG, GIF, WebP).');
      setBannerFile(null);
      return;
    }
    setBannerFile(file);
    setBannerPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmitBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!bannerFile) {
      setError('Please add a banner image.');
      return;
    }
    if (!startAt.trim() || !endAt.trim()) {
      setError('Please set start and end date/time.');
      return;
    }
    const start = cstDatetimeLocalStringToUTC(startAt);
    const end = cstDatetimeLocalStringToUTC(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Invalid date/time.');
      return;
    }
    if (end <= start) {
      setError('End date/time must be after start date/time.');
      return;
    }
    setUploading(true);
    try {
      const { url } = await adsAdminBannerAdsService.uploadImage(bannerFile);
      setUploading(false);
      setSubmitting(true);
      await adsAdminBannerAdsService.create({
        imageUrl: url,
        externalLink: externalLink.trim() || undefined,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      setSuccess('Banner ad posted. It appears at the bottom of the news feed until the end time.');
      setBannerFile(null);
      if (bannerPreviewUrl) {
        URL.revokeObjectURL(bannerPreviewUrl);
        setBannerPreviewUrl(null);
      }
      setExternalLink('');
      setStartAt('');
      setEndAt('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setUploading(false);
      setSubmitting(false);
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Failed to post banner ad. Please try again.';
      setError(msg);
      return;
    }
    setSubmitting(false);
  };

  const goBack = () => {
    setMode('hub');
    resetMessages();
    if (bannerPreviewUrl) {
      URL.revokeObjectURL(bannerPreviewUrl);
      setBannerPreviewUrl(null);
    }
    setBannerFile(null);
    setExternalLink('');
    setStartAt('');
    setEndAt('');
  };

  const handleSponsoredImageChange = (index: number, file: File | null) => {
    resetMessages();
    const next = [...sponsoredImageFiles];
    const nextPreviews = [...sponsoredImagePreviews];
    if (nextPreviews[index]) {
      URL.revokeObjectURL(nextPreviews[index]!);
      nextPreviews[index] = null;
    }
    next[index] = file;
    if (file && file.type.startsWith('image/')) nextPreviews[index] = URL.createObjectURL(file);
    setSponsoredImageFiles(next);
    setSponsoredImagePreviews(nextPreviews);
  };

  const goBackSponsored = () => {
    setMode('hub');
    resetMessages();
    sponsoredImagePreviews.forEach((url) => url && URL.revokeObjectURL(url));
    setSponsoredTitle('');
    setSponsoredDescription('');
    setSponsoredImageFiles([null, null, null, null]);
    setSponsoredImagePreviews([null, null, null, null]);
    setSponsoredExternalLink('');
    setSponsoredStartAt('');
    setSponsoredEndAt('');
  };

  const handleSubmitSponsored = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!sponsoredStartAt.trim() || !sponsoredEndAt.trim()) {
      setError('Please set start and end date/time.');
      return;
    }
    const start = cstDatetimeLocalStringToUTC(sponsoredStartAt);
    const end = cstDatetimeLocalStringToUTC(sponsoredEndAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Invalid date/time.');
      return;
    }
    if (end <= start) {
      setError('End date/time must be after start date/time.');
      return;
    }
    const files = sponsoredImageFiles.filter((f): f is File => f != null);
    setSponsoredUploading(true);
    const urls: string[] = [];
    try {
      for (const file of files) {
        const { url } = await adsAdminSponsoredAdsService.uploadImage(file);
        urls.push(url);
      }
      setSponsoredUploading(false);
      setSponsoredSubmitting(true);
      await adsAdminSponsoredAdsService.create({
        title: sponsoredTitle.trim() || undefined,
        description: sponsoredDescription.trim() || undefined,
        imageUrls: urls.length > 0 ? JSON.stringify(urls) : undefined,
        externalLink: sponsoredExternalLink.trim() || undefined,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      setSuccess(
        'Sponsored ad posted. It appears in the feed with an “Ad” label until the end date/time.',
      );
      goBackSponsored();
    } catch (err: unknown) {
      setSponsoredUploading(false);
      setSponsoredSubmitting(false);
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Failed to post sponsored ad. Please try again.';
      setError(msg);
      return;
    }
    setSponsoredSubmitting(false);
  };

  return (
    <AdsAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">Ads</h1>
        <p className="admin-page-subtitle">
          {mode === 'hub'
            ? 'Choose an ad type to create a new campaign for your school feed.'
            : mode === 'banner'
              ? 'Upload a banner image and set when it should run (CST).'
              : 'Create a sponsored in-feed ad with optional images and schedule (CST).'}
        </p>
      </header>

      {mode === 'hub' ? (
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <button type="button" className="admin-picker-card w-100 text-start" onClick={() => setMode('banner')}>
              <p className="admin-picker-card__title">
                <i className="bi bi-image me-2" aria-hidden />
                Banner ads
              </p>
              <p className="admin-picker-card__meta">Full-width image at the bottom of the news feed</p>
            </button>
          </div>
          <div className="col-12 col-md-6">
            <button
              type="button"
              className="admin-picker-card w-100 text-start"
              onClick={() => setMode('sponsored')}
            >
              <p className="admin-picker-card__title">
                <i className="bi bi-badge-ad me-2" aria-hidden />
                Sponsored ads
              </p>
              <p className="admin-picker-card__meta">In-feed posts with title, images, and “Ad” label</p>
            </button>
          </div>
        </div>
      ) : null}

      {mode === 'banner' ? (
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__body">
            <div className="admin-step-header mb-4">
              <h2 className="admin-panel__title">Post banner ad</h2>
              <button type="button" className="admin-btn-secondary" onClick={goBack}>Back</button>
            </div>
            <form onSubmit={handleSubmitBanner} className="admin-form" style={{ maxWidth: 560 }}>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="ads-banner-image">Banner image</label>
                <input
                  ref={fileInputRef}
                  id="ads-banner-image"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="form-control admin-form-control"
                  onChange={handleBannerFileChange}
                />
              </div>
              {bannerPreviewUrl ? (
                <div className="admin-form-section">
                  <span className="admin-form-label">Preview</span>
                  <img
                    src={bannerPreviewUrl}
                    alt="Banner preview"
                    className="rounded-2 border"
                    style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              ) : null}
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="ads-banner-link">External link (optional)</label>
                <input
                  id="ads-banner-link"
                  type="url"
                  className="form-control admin-form-control"
                  placeholder="https://..."
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                />
              </div>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="ads-banner-start">
                  Start date & time <span className="admin-form-hint">(CST)</span>
                </label>
                <input
                  id="ads-banner-start"
                  type="datetime-local"
                  className="form-control admin-form-control"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                />
              </div>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="ads-banner-end">
                  End date & time <span className="admin-form-hint">(CST)</span>
                </label>
                <input
                  id="ads-banner-end"
                  type="datetime-local"
                  className="form-control admin-form-control"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                />
              </div>
              {error ? <p className="admin-form-hint admin-form-hint--error">{error}</p> : null}
              {success ? (
                <div className="admin-notice admin-notice--info mb-3"><p className="mb-0">{success}</p></div>
              ) : null}
              <div className="admin-form-actions">
                <button type="button" className="admin-btn-secondary" onClick={goBack}>Cancel</button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={uploading || submitting || !bannerFile}
                >
                  {uploading ? 'Uploading…' : submitting ? 'Posting…' : 'Post banner ad'}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      {mode === 'sponsored' ? (
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__body">
            <div className="admin-step-header mb-4">
              <h2 className="admin-panel__title">Post sponsored ad</h2>
              <button type="button" className="admin-btn-secondary" onClick={goBackSponsored}>Back</button>
            </div>
            <form onSubmit={handleSubmitSponsored} className="admin-form" style={{ maxWidth: 640 }}>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="ads-sponsored-title">Title (optional)</label>
                <input
                  id="ads-sponsored-title"
                  type="text"
                  className="form-control admin-form-control"
                  value={sponsoredTitle}
                  onChange={(e) => setSponsoredTitle(e.target.value)}
                />
              </div>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="ads-sponsored-desc">Description (optional)</label>
                <textarea
                  id="ads-sponsored-desc"
                  className="form-control admin-form-control"
                  rows={3}
                  value={sponsoredDescription}
                  onChange={(e) => setSponsoredDescription(e.target.value)}
                />
              </div>
              <div className="admin-form-section">
                <span className="admin-form-label">Images (optional, up to 4)</span>
                <div className="d-flex flex-wrap gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="form-control admin-form-control form-control-sm"
                        style={{ maxWidth: 140 }}
                        ref={(el) => {
                          sponsoredFileRefs.current[i] = el;
                        }}
                        onChange={(e) => handleSponsoredImageChange(i, e.target.files?.[0] ?? null)}
                      />
                      {sponsoredImagePreviews[i] ? (
                        <img
                          src={sponsoredImagePreviews[i]!}
                          alt=""
                          className="mt-2 rounded border"
                          style={{ width: 80, height: 56, objectFit: 'cover' }}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="ads-sponsored-link">External link (optional)</label>
                <input
                  id="ads-sponsored-link"
                  type="url"
                  className="form-control admin-form-control"
                  value={sponsoredExternalLink}
                  onChange={(e) => setSponsoredExternalLink(e.target.value)}
                />
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="ads-sponsored-start">
                    Start <span className="admin-form-hint">(CST)</span>
                  </label>
                  <input
                    id="ads-sponsored-start"
                    type="datetime-local"
                    className="form-control admin-form-control"
                    value={sponsoredStartAt}
                    onChange={(e) => setSponsoredStartAt(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="ads-sponsored-end">
                    End <span className="admin-form-hint">(CST)</span>
                  </label>
                  <input
                    id="ads-sponsored-end"
                    type="datetime-local"
                    className="form-control admin-form-control"
                    value={sponsoredEndAt}
                    onChange={(e) => setSponsoredEndAt(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error ? <p className="admin-form-hint admin-form-hint--error mt-3">{error}</p> : null}
              {success ? (
                <div className="admin-notice admin-notice--info mt-3"><p className="mb-0">{success}</p></div>
              ) : null}
              <div className="admin-form-actions mt-4">
                <button type="button" className="admin-btn-secondary" onClick={goBackSponsored}>Cancel</button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={sponsoredUploading || sponsoredSubmitting}
                >
                  {sponsoredUploading ? 'Uploading…' : sponsoredSubmitting ? 'Posting…' : 'Post sponsored ad'}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </AdsAdminLayout>
  );
};
