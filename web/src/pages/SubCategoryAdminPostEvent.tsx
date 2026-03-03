import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import { subcategoryAdminEventsService } from '../services/subcategory-admin-events.service';

type CreateMode = 'choose' | 'manual' | 'ai';
type AIStep = 'banner' | 'form';

const MAX_IMAGES = 4;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const SubCategoryAdminPostEvent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useSubCategoryAdminAuth();
  const resubmitEvent = (location.state as { resubmitEvent?: { title: string; description: string | null; externalLink: string | null; commentsEnabled: boolean; subCategory: { id: string; name: string } } })?.resubmitEvent;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const availableSubcategories =
    user?.subCategories && user.subCategories.length > 0
      ? user.subCategories
      : user?.subCategoryName
        ? [{ id: user.subCategoryId, name: user.subCategoryName }]
        : [];
  const hasMultipleSubcategories = availableSubcategories.length > 1;
  const initialSubcategoryId = availableSubcategories.length > 0 ? availableSubcategories[0].id : '';
  const initialSubcategoryName = availableSubcategories.length > 0 ? availableSubcategories[0].name : '';

  const [mode, setMode] = useState<CreateMode>('choose');
  const [aiStep, setAIStep] = useState<AIStep>('banner');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    externalLink: '',
    category: user?.categoryName || '',
    subcategoryId: initialSubcategoryId,
    subcategory: initialSubcategoryName,
    commentsEnabled: true,
    imageFiles: [] as File[],
  });
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    refreshUser().catch(console.error);
  }, [refreshUser]);

  // Preview URLs for the 4 image slots (create/revoke object URLs when imageFiles change)
  useEffect(() => {
    const urls = formData.imageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [formData.imageFiles]);

  useEffect(() => {
    if (user) {
      const subcategories =
        user.subCategories && user.subCategories.length > 0
          ? user.subCategories
          : user.subCategoryName
            ? [{ id: user.subCategoryId, name: user.subCategoryName }]
            : [];
      if (subcategories.length > 0) {
        const selected = subcategories.find((sc) => sc.id === formData.subcategoryId) || subcategories[0];
        setFormData((prev) => ({
          ...prev,
          category: user.categoryName || prev.category,
          subcategoryId: selected.id,
          subcategory: selected.name,
        }));
      }
    }
  }, [user]);

  const hasAppliedResubmit = useRef(false);
  // Pre-fill form when resubmitting from Received corrections (once)
  useEffect(() => {
    if (resubmitEvent && user && !hasAppliedResubmit.current) {
      hasAppliedResubmit.current = true;
      setMode('manual');
      const subcategoryId = resubmitEvent.subCategory?.id ?? (user.subCategoryId || '');
      const subcategoryName = resubmitEvent.subCategory?.name ?? (user.subCategoryName || '');
      setFormData((prev) => ({
        ...prev,
        title: resubmitEvent.title ?? '',
        description: resubmitEvent.description ?? '',
        externalLink: resubmitEvent.externalLink ?? '',
        subcategoryId,
        subcategory: subcategoryName,
        commentsEnabled: resubmitEvent.commentsEnabled ?? true,
        category: user.categoryName || prev.category,
      }));
    }
  }, [resubmitEvent, user]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAnalyzeError('Please use JPEG, PNG, GIF or WebP.');
      return;
    }
    setAnalyzeError(null);
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyzeBanner = async () => {
    if (!bannerFile) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await subcategoryAdminEventsService.analyzeBanner(bannerFile);
      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        externalLink: result.externalLink || prev.externalLink,
      }));
      setAIStep('form');
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Failed to analyze image. Check your connection and try again.';
      setAnalyzeError(typeof message === 'string' ? message : 'Failed to analyze image.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => ALLOWED_IMAGE_TYPES.includes(f.type));
    setFormData((prev) => {
      const combined = [...prev.imageFiles, ...valid].slice(0, MAX_IMAGES);
      return { ...prev, imageFiles: combined };
    });
    e.target.value = '';
  };

  const removeImageAt = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
    }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const imageUrls: string[] = [];
      for (const file of formData.imageFiles) {
        const { url } = await subcategoryAdminEventsService.uploadEventImage(file);
        imageUrls.push(url);
      }
      await subcategoryAdminEventsService.create({
        title: formData.title,
        description: formData.description || undefined,
        externalLink: formData.externalLink || undefined,
        commentsEnabled: formData.commentsEnabled,
        subCategoryId: formData.subcategoryId,
        imageUrls,
      });
      // Reset form and go back to choose mode or redirect to approvals pending
      setFormData((prev) => ({
        ...prev,
        title: '',
        description: '',
        externalLink: '',
        imageFiles: [],
      }));
      setMode('choose');
      setAIStep('banner');
      setBannerFile(null);
      setBannerPreview(null);
      navigate('/subcategory-admin/approvals-pending');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to submit. Try again.';
      setSubmitError(typeof msg === 'string' ? msg : 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  const NAVBAR_COLOR = '#1a1f2e';

  const optionBoxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    width: '30%',
    padding: '0.5rem 1rem',
    backgroundColor: '#fff',
    border: `1px solid ${NAVBAR_COLOR}`,
    borderRadius: '50px',
    color: NAVBAR_COLOR,
    fontFamily: 'inherit',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
  };

  const renderChooseMode = () => (
    <div className="d-flex flex-wrap gap-3">
      <button
          type="button"
          onClick={() => setMode('manual')}
          style={optionBoxStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = NAVBAR_COLOR;
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.color = NAVBAR_COLOR;
          }}
        >
          <i className="bi bi-pencil-square" style={{ fontSize: '1.25rem', color: 'inherit' }} aria-hidden />
          <span>create manually</span>
        </button>
      <button
        type="button"
        onClick={() => setMode('ai')}
        style={optionBoxStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = NAVBAR_COLOR;
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fff';
          e.currentTarget.style.color = NAVBAR_COLOR;
        }}
      >
        {/* ChatGPT-style sparkle icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ flexShrink: 0 }}
          aria-hidden
        >
          <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
        </svg>
        <span>generate with ai</span>
      </button>
    </div>
  );

  const renderAIBannerStep = () => (
    <div className="mb-4">
      <h3 style={{ fontSize: '1.25rem', color: '#1a1f2e', marginBottom: '1rem' }}>Upload banner image</h3>
      <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
        Upload an image that contains the event context. We&apos;ll analyze it and suggest title, description and external link.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleBannerChange}
        className="d-none"
      />
      {!bannerPreview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #dee2e6',
            borderRadius: '0px',
            padding: '3rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: '#f8f9fa',
          }}
        >
          <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', color: '#6c757d' }} />
          <p style={{ margin: '1rem 0 0', color: '#6c757d' }}>Click to select banner image (JPEG, PNG, GIF, WebP)</p>
        </div>
      ) : (
        <div>
          <img
            src={bannerPreview}
            alt="Banner preview"
            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', border: '1px solid #dee2e6' }}
          />
          <div className="mt-2 d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              style={{ borderRadius: '0px' }}
              onClick={() => fileInputRef.current?.click()}
            >
              Change image
            </button>
            <button
              type="button"
              className="btn"
              style={{ backgroundColor: '#1a1f2e', color: 'white', borderRadius: '0px' }}
              onClick={handleAnalyzeBanner}
              disabled={analyzing}
            >
              {analyzing ? 'Analyzing…' : 'Analyze with AI'}
            </button>
          </div>
        </div>
      )}
      {analyzeError && (
        <div className="alert alert-danger mt-2" style={{ borderRadius: '0px' }}>
          {analyzeError}
        </div>
      )}
      <button
        type="button"
        className="btn btn-link mt-3 p-0"
        style={{ color: '#6c757d' }}
        onClick={() => { setMode('choose'); setBannerFile(null); setBannerPreview(null); setAIStep('banner'); setAnalyzeError(null); }}
      >
        ← Back to options
      </button>
    </div>
  );

  const renderEventForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>Category</label>
          <input
            type="text"
            className="form-control"
            style={{ borderRadius: '0px', backgroundColor: '#f8f9fa' }}
            value={formData.category}
            disabled
          />
        </div>
        <div className="col-md-6">
          <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>
            Subcategory {hasMultipleSubcategories && <span style={{ color: '#dc3545' }}>*</span>}
          </label>
          {hasMultipleSubcategories ? (
            <select
              className="form-select"
              style={{ borderRadius: '0px' }}
              value={formData.subcategoryId}
              onChange={(e) => {
                const sc = availableSubcategories.find((s) => s.id === e.target.value);
                if (sc) setFormData({ ...formData, subcategoryId: sc.id, subcategory: sc.name });
              }}
              required
            >
              <option value="">Select subcategory</option>
              {availableSubcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: '0px', backgroundColor: '#f8f9fa' }}
              value={formData.subcategory}
              disabled
            />
          )}
        </div>

        <div className="col-12">
          <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>
            Title <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <input
            type="text"
            className="form-control"
            style={{ borderRadius: '0px' }}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="col-12">
          <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>Description (optional)</label>
          <textarea
            className="form-control"
            rows={4}
            style={{ borderRadius: '0px' }}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="col-12">
          <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>External link (optional)</label>
          <input
            type="url"
            className="form-control"
            style={{ borderRadius: '0px' }}
            placeholder="https://"
            value={formData.externalLink}
            onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
          />
        </div>

        <div className="col-12">
          <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>Images (optional, up to {MAX_IMAGES})</label>
          <input
            ref={imageInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleImageFilesChange}
            className="d-none"
          />
          <div className="d-flex flex-wrap gap-2 mt-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => imageInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); imageInputRef.current?.click(); } }}
                style={{
                  width: '100px',
                  height: '100px',
                  border: '2px dashed #dee2e6',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {imagePreviewUrls[i] ? (
                  <>
                    <img
                      src={imagePreviewUrls[i]}
                      alt={`Preview ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      aria-label={`Remove image ${i + 1}`}
                      onClick={(e) => { e.stopPropagation(); removeImageAt(i); }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <span style={{ color: '#6c757d', fontSize: '2rem' }}>+</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1 small text-muted">
            Click an empty box to add images (JPEG, PNG, GIF, WebP). Up to {MAX_IMAGES} images.
          </p>
        </div>

        <div className="col-12">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="commentsEnabled"
              style={{ borderRadius: '50px' }}
              checked={formData.commentsEnabled}
              onChange={(e) => setFormData({ ...formData, commentsEnabled: e.target.checked })}
            />
            <label className="form-check-label" htmlFor="commentsEnabled" style={{ color: '#1a1f2e' }}>
              Allow users to comment
            </label>
          </div>
        </div>

        <div className="col-12 d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            style={{ borderRadius: '0px' }}
            onClick={() => {
              setMode('choose');
              setAIStep('banner');
              setBannerFile(null);
              setBannerPreview(null);
            }}
          >
            Back
          </button>
          {submitError && (
            <div className="alert alert-danger" style={{ borderRadius: '0px' }}>
              {submitError}
            </div>
          )}
          <button
            type="submit"
            className="btn"
            disabled={submitting}
            style={{
              backgroundColor: '#1a1f2e',
              color: 'white',
              borderRadius: '0px',
              padding: '0.75rem 2rem',
              fontWeight: '500',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <SubCategoryAdminLayout>
      <div className="mb-4">
        <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
          Post the event
        </h1>
        <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
          Create and submit a new event for approval
        </p>
      </div>

      <div className="card border-0" style={{ borderRadius: '0px', backgroundColor: 'transparent', boxShadow: 'none' }}>
        <div className="card-body p-4" style={{ backgroundColor: 'transparent' }}>
          {mode === 'choose' && renderChooseMode()}
          {mode === 'manual' && (
            <>
              <div className="d-flex align-items-center mb-3">
                <span className="badge bg-secondary me-2">Create manually</span>
                <button
                  type="button"
                  className="btn btn-link p-0 small"
                  style={{ color: '#6c757d' }}
                  onClick={() => setMode('choose')}
                >
                  Change option
                </button>
              </div>
              {renderEventForm()}
            </>
          )}
          {mode === 'ai' && aiStep === 'banner' && (
            <>
              <div className="d-flex align-items-center mb-3">
                <span className="badge bg-secondary me-2">Generate with AI</span>
              </div>
              {renderAIBannerStep()}
            </>
          )}
          {mode === 'ai' && aiStep === 'form' && (
            <>
              <div className="d-flex align-items-center mb-3">
                <span className="badge bg-secondary me-2">Generate with AI</span>
                <span className="small text-muted">— Review and add images, then submit</span>
              </div>
              {renderEventForm()}
            </>
          )}
        </div>
      </div>
    </SubCategoryAdminLayout>
  );
};
