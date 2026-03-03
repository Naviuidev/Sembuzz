import { useState, useRef } from 'react';
import { CategoryAdminNavbar } from '../components/CategoryAdminNavbar';
import { CategoryAdminSidebar } from '../components/CategoryAdminSidebar';
import { categoryAdminBannerAdsService } from '../services/category-admin-banner-ads.service';
import { categoryAdminSponsoredAdsService } from '../services/category-admin-sponsored-ads.service';
import { cstDatetimeLocalStringToUTC } from '../utils/cst-date';

const MAX_SPONSORED_IMAGES = 4;

export const CategoryAdminAds = () => {
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showSponsoredForm, setShowSponsoredForm] = useState(false);
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

  // Sponsored ad form state
  const [sponsoredTitle, setSponsoredTitle] = useState('');
  const [sponsoredDescription, setSponsoredDescription] = useState('');
  const [sponsoredImageFiles, setSponsoredImageFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [sponsoredImagePreviews, setSponsoredImagePreviews] = useState<(string | null)[]>([null, null, null, null]);
  const [sponsoredExternalLink, setSponsoredExternalLink] = useState('');
  const [sponsoredStartAt, setSponsoredStartAt] = useState('');
  const [sponsoredEndAt, setSponsoredEndAt] = useState('');
  const [sponsoredUploading, setSponsoredUploading] = useState(false);
  const [sponsoredSubmitting, setSponsoredSubmitting] = useState(false);
  const sponsoredFileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(null);
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
    setError(null);
    setSuccess(null);
    if (!bannerFile) {
      setError('Please add a banner image.');
      return;
    }
    if (!startAt.trim()) {
      setError('Please set start date and time.');
      return;
    }
    if (!endAt.trim()) {
      setError('Please set end date and time.');
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
      const { url } = await categoryAdminBannerAdsService.uploadImage(bannerFile);
      setUploading(false);
      setSubmitting(true);
      await categoryAdminBannerAdsService.create({
        imageUrl: url,
        externalLink: externalLink.trim() || undefined,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      setSuccess('Banner ad posted. It will appear at the bottom of the news feed until the end date/time.');
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
      const msg = err && typeof err === 'object' && 'response' in err && typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
        ? (err as { response: { data: { message: string } } }).response.data.message
        : 'Failed to post banner ad. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setShowBannerForm(false);
    setError(null);
    setSuccess(null);
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
    setError(null);
    setSuccess(null);
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
    setShowSponsoredForm(false);
    setError(null);
    setSuccess(null);
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
    setError(null);
    setSuccess(null);
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
    if (files.length > MAX_SPONSORED_IMAGES) {
      setError(`Maximum ${MAX_SPONSORED_IMAGES} images.`);
      return;
    }
    setSponsoredUploading(true);
    const urls: string[] = [];
    try {
      for (const file of files) {
        const { url } = await categoryAdminSponsoredAdsService.uploadImage(file);
        urls.push(url);
      }
      setSponsoredUploading(false);
      setSponsoredSubmitting(true);
      await categoryAdminSponsoredAdsService.create({
        title: sponsoredTitle.trim() || undefined,
        description: sponsoredDescription.trim() || undefined,
        imageUrls: urls.length > 0 ? JSON.stringify(urls) : undefined,
        externalLink: sponsoredExternalLink.trim() || undefined,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      });
      setSuccess('Sponsored ad posted. It will appear in the feed with a light blue background and "Ad" label until the end date/time.');
      setSponsoredTitle('');
      setSponsoredDescription('');
      setSponsoredImageFiles([null, null, null, null]);
      sponsoredImagePreviews.forEach((url) => url && URL.revokeObjectURL(url));
      setSponsoredImagePreviews([null, null, null, null]);
      setSponsoredExternalLink('');
      setSponsoredStartAt('');
      setSponsoredEndAt('');
      sponsoredFileRefs.current.forEach((ref) => { if (ref) ref.value = ''; });
    } catch (err: unknown) {
      setSponsoredUploading(false);
      setSponsoredSubmitting(false);
      const msg = err && typeof err === 'object' && 'response' in err && typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
        ? (err as { response: { data: { message: string } } }).response.data.message
        : 'Failed to post sponsored ad. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#eef1f5' }}>
      <CategoryAdminNavbar />
      <div className="d-flex">
        <CategoryAdminSidebar />
        <div style={{ flex: 1, padding: '1.5rem 2rem', minWidth: 0 }}>
          <div className="mb-4">
            <h1 className="h4 mb-1" style={{ color: '#1a1f2e', fontWeight: 600 }}>
              Ads
            </h1>
            <p className="small text-muted mb-0">
              Manage banner and sponsored ads for your categories.
            </p>
          </div>

          {showSponsoredForm ? (
            <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef', maxWidth: 520 }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={goBackSponsored} aria-label="Back">
                  <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                </button>
                <h2 className="h6 mb-0" style={{ color: '#1a1f2e', fontWeight: 600 }}>Post sponsored ad</h2>
              </div>
              <p className="small text-muted mb-3">Same UI as news in the feed, with a light blue background and &quot;Ad&quot; label. All fields are optional except start and end date/time.</p>

              <form onSubmit={handleSubmitSponsored}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Title (optional)</label>
                  <input type="text" className="form-control form-control-sm" placeholder="Ad title" value={sponsoredTitle} onChange={(e) => setSponsoredTitle(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Description (optional)</label>
                  <textarea className="form-control form-control-sm" rows={3} placeholder="Ad description" value={sponsoredDescription} onChange={(e) => setSponsoredDescription(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Images (optional, up to 4)</label>
                  <div className="d-flex flex-wrap gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="d-flex flex-column align-items-center">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className="form-control form-control-sm"
                          style={{ width: 100 }}
                          ref={(el) => { sponsoredFileRefs.current[i] = el; }}
                          onChange={(e) => handleSponsoredImageChange(i, e.target.files?.[0] ?? null)}
                        />
                        {sponsoredImagePreviews[i] && (
                          <div className="mt-1 rounded overflow-hidden border" style={{ width: 80, height: 56, backgroundColor: '#f8f9fa' }}>
                            <img src={sponsoredImagePreviews[i]!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">External link (optional)</label>
                  <input type="url" className="form-control form-control-sm" placeholder="https://..." value={sponsoredExternalLink} onChange={(e) => setSponsoredExternalLink(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Start date & time <span className="text-muted fw-normal">(CST)</span></label>
                  <input type="datetime-local" className="form-control form-control-sm" value={sponsoredStartAt} onChange={(e) => setSponsoredStartAt(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-semibold">End date & time <span className="text-muted fw-normal">(CST)</span></label>
                  <input type="datetime-local" className="form-control form-control-sm" value={sponsoredEndAt} onChange={(e) => setSponsoredEndAt(e.target.value)} required />
                </div>

                {error && <div className="alert alert-danger small py-2 mb-3">{error}</div>}
                {success && <div className="alert alert-success small py-2 mb-3">{success}</div>}

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={goBackSponsored}>Cancel</button>
                  <button type="submit" className="btn btn-success btn-sm" disabled={sponsoredUploading || sponsoredSubmitting}>
                    {sponsoredUploading ? 'Uploading…' : sponsoredSubmitting ? 'Posting…' : 'Post sponsored ad'}
                  </button>
                </div>
              </form>
            </div>
          ) : showBannerForm ? (
            <div className="rounded-3 p-4 mb-4" style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef', maxWidth: 520 }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={goBack} aria-label="Back">
                  <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                </button>
                <h2 className="h6 mb-0" style={{ color: '#1a1f2e', fontWeight: 600 }}>Post banner ad</h2>
              </div>
              <p className="small text-muted mb-3">Add a banner image and set when it should appear. The banner will show at the bottom of the news feed for guests and logged-in users until the end date/time.</p>

              <form onSubmit={handleSubmitBanner}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Banner image</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="form-control form-control-sm"
                    onChange={handleBannerFileChange}
                  />
                </div>
                {bannerPreviewUrl && (
                  <div className="mb-3">
                    <span className="small text-muted d-block mb-1">Preview</span>
                    <div className="rounded-2 overflow-hidden border" style={{ maxWidth: 400, backgroundColor: '#f8f9fa' }}>
                      <img src={bannerPreviewUrl} alt="Banner preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-semibold">External link (optional)</label>
                  <input
                    type="url"
                    className="form-control form-control-sm"
                    placeholder="https://..."
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                  />
                  <span className="small text-muted">If set, clicking the banner will open this link.</span>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Start date & time <span className="text-muted fw-normal">(CST)</span></label>
                  <input
                    type="datetime-local"
                    className="form-control form-control-sm"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-semibold">End date & time <span className="text-muted fw-normal">(CST)</span></label>
                  <input
                    type="datetime-local"
                    className="form-control form-control-sm"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </div>

                {error && <div className="alert alert-danger small py-2 mb-3">{error}</div>}
                {success && <div className="alert alert-success small py-2 mb-3">{success}</div>}

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={goBack}>Cancel</button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={uploading || submitting || !bannerFile}
                  >
                    {uploading ? 'Uploading…' : submitting ? 'Posting…' : 'Post banner ad'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-4">
              <button
                type="button"
                className="btn btn-lg rounded-3 border-0 d-flex align-items-center justify-content-center gap-3 shadow-sm"
                style={{
                  minWidth: 220,
                  minHeight: 140,
                  backgroundColor: '#cff4fc',
                  color: '#055160',
                }}
                onClick={() => setShowBannerForm(true)}
              >
                <i className="bi bi-image" style={{ fontSize: '2rem' }} />
                <span className="fw-semibold">Banner Ads</span>
              </button>

              <button
                type="button"
                className="btn btn-lg rounded-3 border-0 d-flex align-items-center justify-content-center gap-3 shadow-sm"
                style={{
                  minWidth: 220,
                  minHeight: 140,
                  backgroundColor: '#d1e7dd',
                  color: '#0f5132',
                }}
                onClick={() => setShowSponsoredForm(true)}
              >
                <i className="bi bi-badge-ad" style={{ fontSize: '2rem' }} />
                <span className="fw-semibold">Sponsored Ads</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
