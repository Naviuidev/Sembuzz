import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import {
  subcategoryAdminBlogsService,
  type CreateBlogContentBlock,
} from '../services/subcategory-admin-blogs.service';
import { BlogBlockRenderer } from '../components/BlogBlockRenderer';
import type { ContentBlock } from '../services/public-blogs.service';
import { imageSrc } from '../utils/image';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function newId() {
  return crypto.randomUUID();
}

type EditorBlock =
  | { id: string; type: 'heading'; value: string; cols: number }
  | { id: string; type: 'paragraph'; value: string; cols: number }
  | {
      id: string;
      type: 'image';
      cols: number;
      alt: string;
      imageUrl?: string;
      file?: File;
      /** Data URL while uploading or before upload */
      localPreview?: string;
    }
  | {
      id: string;
      type: 'heading_para';
      heading: string;
      paragraph: string;
      cols: number;
    };

type ResubmitBlog = {
  title: string;
  content: string;
  coverImageUrl: string | null;
  subCategory: { id: string; name: string };
};

const COL_OPTIONS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function blockHasText(b: EditorBlock): boolean {
  if (b.type === 'heading') return !!b.value.trim();
  if (b.type === 'paragraph') return !!b.value.trim();
  if (b.type === 'heading_para')
    return !!(b.heading.trim() || b.paragraph.trim());
  return false;
}

function editorToApiBlocks(blocks: EditorBlock[]): CreateBlogContentBlock[] {
  const out: CreateBlogContentBlock[] = [];
  for (const b of blocks) {
    if (b.type === 'heading' && b.value.trim()) {
      out.push({ type: 'heading', value: b.value.trim(), cols: b.cols });
    } else if (b.type === 'paragraph' && b.value.trim()) {
      out.push({ type: 'paragraph', value: b.value.trim(), cols: b.cols });
    } else if (b.type === 'image' && b.imageUrl) {
      out.push({
        type: 'image',
        imageUrl: b.imageUrl,
        cols: b.cols,
        alt: b.alt.trim() || undefined,
      });
    } else if (
      b.type === 'heading_para' &&
      (b.heading.trim() || b.paragraph.trim())
    ) {
      out.push({
        type: 'heading_para',
        heading: b.heading.trim(),
        paragraph: b.paragraph.trim(),
        cols: b.cols,
      });
    }
  }
  return out;
}

function toPreviewBlocks(blocks: EditorBlock[]): ContentBlock[] {
  const list: ContentBlock[] = [];
  for (const b of blocks) {
    if (b.type === 'heading' && b.value.trim()) {
      list.push({ type: 'heading', value: b.value, cols: b.cols });
    } else if (b.type === 'paragraph' && b.value.trim()) {
      list.push({ type: 'paragraph', value: b.value, cols: b.cols });
    } else if (b.type === 'image') {
      const url = b.imageUrl || b.localPreview;
      if (url) {
        list.push({
          type: 'image',
          imageUrl: url,
          cols: b.cols,
          alt: b.alt,
        });
      }
    } else if (
      b.type === 'heading_para' &&
      (b.heading.trim() || b.paragraph.trim())
    ) {
      list.push({
        type: 'heading_para',
        heading: b.heading,
        paragraph: b.paragraph,
        cols: b.cols,
      });
    }
  }
  return list;
}

export const SubCategoryAdminPostBlog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resubmitBlog = (location.state as { resubmitBlog?: ResubmitBlog })
    ?.resubmitBlog;
  const { user, refreshUser } = useSubCategoryAdminAuth();

  const availableSubcategories =
    user?.subCategories && user.subCategories.length > 0
      ? user.subCategories
      : user?.subCategoryName
        ? [{ id: user.subCategoryId, name: user.subCategoryName }]
        : [];
  const initialSubId = availableSubcategories[0]?.id ?? '';

  const [subcategoryId, setSubcategoryId] = useState(initialSubId);
  const [title, setTitle] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroParagraph, setHeroParagraph] = useState('');
  const [heroButtonText, setHeroButtonText] = useState('');
  const [heroButtonLink, setHeroButtonLink] = useState('');
  const [listingSummary, setListingSummary] = useState('');
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: newId(), type: 'paragraph', value: '', cols: 12 },
  ]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const hasAppliedResubmit = useRef(false);

  const previewBlocks = useMemo(() => toPreviewBlocks(blocks), [blocks]);

  useEffect(() => {
    refreshUser().catch(console.error);
  }, [refreshUser]);

  useEffect(() => {
    if (user && availableSubcategories.length && !resubmitBlog) {
      const sel =
        availableSubcategories.find((s) => s.id === subcategoryId) ||
        availableSubcategories[0];
      setSubcategoryId(sel.id);
    }
  }, [user]);

  useEffect(() => {
    if (resubmitBlog && user && !hasAppliedResubmit.current) {
      hasAppliedResubmit.current = true;
      setTitle(resubmitBlog.title ?? '');
      setListingSummary(resubmitBlog.content ?? '');
      setBlocks([
        {
          id: newId(),
          type: 'paragraph',
          value: resubmitBlog.content ?? '',
          cols: 12,
        },
      ]);
      setSubcategoryId(resubmitBlog.subCategory?.id ?? user.subCategoryId);
      if (resubmitBlog.coverImageUrl) {
        setCoverUrl(resubmitBlog.coverImageUrl);
        setCoverPreview(resubmitBlog.coverImageUrl);
      }
    }
  }, [resubmitBlog, user]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Cover: use JPEG, PNG, GIF or WebP.');
      return;
    }
    setError(null);
    setCoverFile(file);
    setCoverUrl(null);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addBlock = (type: EditorBlock['type']) => {
    const id = newId();
    if (type === 'heading') {
      setBlocks((prev) => [...prev, { id, type: 'heading', value: '', cols: 12 }]);
    } else if (type === 'paragraph') {
      setBlocks((prev) => [
        ...prev,
        { id, type: 'paragraph', value: '', cols: 12 },
      ]);
    } else if (type === 'image') {
      setBlocks((prev) => [
        ...prev,
        { id, type: 'image', cols: 12, alt: '', file: undefined },
      ]);
    } else {
      setBlocks((prev) => [
        ...prev,
        {
          id,
          type: 'heading_para',
          heading: '',
          paragraph: '',
          cols: 12,
        },
      ]);
    }
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, patch: Partial<EditorBlock>) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } as EditorBlock : b)),
    );
  };

  const handleImageBlockFile = async (index: number, file: File | null) => {
    if (!file) {
      updateBlock(index, {
        file: undefined,
        imageUrl: undefined,
        localPreview: undefined,
      });
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Images: use JPEG, PNG, GIF or WebP.');
      return;
    }
    setError(null);
    updateBlock(index, {
      file,
      imageUrl: undefined,
      localPreview: undefined,
    });
    const reader = new FileReader();
    reader.onload = () =>
      updateBlock(index, { localPreview: reader.result as string });
    reader.readAsDataURL(file);
    try {
      const up = await subcategoryAdminBlogsService.uploadImage(file);
      updateBlock(index, {
        imageUrl: up.url,
        file: undefined,
        localPreview: undefined,
      });
    } catch {
      setError('Image upload failed. Try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!subcategoryId) {
      setError('Select a subcategory.');
      return;
    }
    const hasText =
      blocks.some(blockHasText) || !!listingSummary.trim();
    if (!hasText) {
      setError(
        'Add at least one heading, paragraph, or heading+paragraph block (or a listing summary).',
      );
      return;
    }
    for (const b of blocks) {
      if (b.type === 'image' && !b.imageUrl && !b.file) {
        setError('Remove empty image blocks or upload an image.');
        return;
      }
    }
    setSubmitting(true);
    try {
      let finalCover = coverUrl;
      if (coverFile) {
        const up = await subcategoryAdminBlogsService.uploadImage(coverFile);
        finalCover = up.url;
      }
      const working = await Promise.all(
        blocks.map(async (b) => {
          if (b.type === 'image' && b.file && !b.imageUrl) {
            const up = await subcategoryAdminBlogsService.uploadImage(b.file);
            return {
              ...b,
              imageUrl: up.url,
              file: undefined,
              localPreview: undefined,
            } as EditorBlock;
          }
          return b;
        }),
      );
      const finalBlocks = editorToApiBlocks(working);
      await subcategoryAdminBlogsService.create({
        subCategoryId: subcategoryId,
        title: title.trim(),
        content: listingSummary.trim() || undefined,
        coverImageUrl: finalCover ?? undefined,
        heroTitle: heroTitle.trim() || undefined,
        heroParagraph: heroParagraph.trim() || undefined,
        heroButtonText: heroButtonText.trim() || undefined,
        heroButtonLink: heroButtonLink.trim() || undefined,
        contentBlocks: finalBlocks.length ? finalBlocks : undefined,
      });
      navigate('/subcategory-admin/blog-pending', {
        state: { message: 'Blog submitted for category admin approval.' },
      });
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: unknown } } }
      ).response?.data;
      let msg: string | null = null;
      if (data?.message != null) {
        const m = data.message;
        if (typeof m === 'string') msg = m;
        else if (Array.isArray(m)) msg = m.filter(Boolean).join('. ');
      }
      setError(
        msg ||
          (err instanceof Error && err.message && !err.message.includes('status code')
            ? err.message
            : null) ||
          'Could not submit blog. Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const previewHeroTitle = heroTitle.trim() || title.trim() || 'Blog title';
  const previewHeroPara =
    heroParagraph.trim() ||
    listingSummary.trim().slice(0, 220) ||
    'Hero subtitle appears here when you fill Banner subtitle or Listing summary.';

  return (
    <SubCategoryAdminLayout>
      <div className="mb-4">
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '0.5rem',
          }}
        >
          Post blog
        </h1>
        <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
          Build your article with blocks, set column width per block (12 = full
          width), then preview before submitting for approval.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ borderRadius: 0 }}>
          {error}
        </div>
      )}

      <ul className="nav nav-tabs d-lg-none mb-3 border-0">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'edit' ? 'active fw-semibold' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Edit
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'preview' ? 'active fw-semibold' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </li>
      </ul>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div
            className={`col-lg-7 ${activeTab === 'preview' ? 'd-none d-lg-block' : ''}`}
          >
            <div
              className="card border-0 shadow-sm mb-4"
              style={{ borderRadius: 0 }}
            >
              <div className="card-body p-4">
                <div
                  className="mb-4 p-3 rounded"
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                  }}
                >
                  <div className="small fw-semibold text-secondary mb-2">
                    Posting to subcategory
                  </div>
                  {availableSubcategories.length === 0 ? (
                    <p className="small text-muted mb-0">
                      No subcategory assigned. Contact your school admin.
                    </p>
                  ) : availableSubcategories.length === 1 ? (
                    <p className="mb-0 fw-medium" style={{ color: '#1a1f2e' }}>
                      {availableSubcategories[0].name}
                    </p>
                  ) : (
                    <select
                      className="form-select"
                      style={{ borderRadius: 0, maxWidth: 320 }}
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                    >
                      {availableSubcategories.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ borderRadius: 0 }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={500}
                    placeholder="Blog title"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Banner (hero) — optional
                  </label>
                  <p className="small text-muted mb-2">
                    Shown over the cover image on the public blog page.
                  </p>
                  <input
                    type="text"
                    className="form-control mb-2"
                    style={{ borderRadius: 0 }}
                    placeholder="Banner headline (defaults to title if empty)"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    maxLength={300}
                  />
                  <textarea
                    className="form-control mb-2"
                    style={{ borderRadius: 0, minHeight: 72 }}
                    placeholder="Banner subtitle"
                    value={heroParagraph}
                    onChange={(e) => setHeroParagraph(e.target.value)}
                  />
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        placeholder="Button label (optional)"
                        value={heroButtonText}
                        onChange={(e) => setHeroButtonText(e.target.value)}
                        maxLength={120}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        placeholder="Button link URL or path"
                        value={heroButtonLink}
                        onChange={(e) => setHeroButtonLink(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Cover image (optional)
                  </label>
                  <input
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    className="form-control"
                    style={{ borderRadius: 0 }}
                    onChange={handleCoverChange}
                  />
                  {coverPreview && (
                    <img
                      src={coverPreview}
                      alt=""
                      className="mt-2"
                      style={{
                        maxHeight: 140,
                        objectFit: 'cover',
                        border: '1px solid #dee2e6',
                      }}
                    />
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Listing summary (optional)
                  </label>
                  <textarea
                    className="form-control"
                    style={{ borderRadius: 0, minHeight: 80 }}
                    placeholder="Short text for blog cards / search. If empty, text is taken from your blocks."
                    value={listingSummary}
                    onChange={(e) => setListingSummary(e.target.value)}
                  />
                </div>

                <hr className="my-4" />
                <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                  <span className="fw-semibold me-2">Article blocks</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius: 0 }}
                    onClick={() => addBlock('heading')}
                  >
                    + Heading
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius: 0 }}
                    onClick={() => addBlock('paragraph')}
                  >
                    + Paragraph
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius: 0 }}
                    onClick={() => addBlock('heading_para')}
                  >
                    + Heading + paragraph
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius: 0 }}
                    onClick={() => addBlock('image')}
                  >
                    + Image
                  </button>
                </div>
                <p className="small text-muted mb-3">
                  On desktop, blocks sit in a 12-column grid. Choose how many
                  columns (of 12) each block uses — e.g. 6 = half width.
                </p>

                {blocks.map((b, i) => (
                  <div
                    key={b.id}
                    className="border mb-3 p-3"
                    style={{
                      borderColor: '#dee2e6',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                      <span className="small fw-semibold text-secondary text-uppercase">
                        {b.type === 'heading_para'
                          ? 'Heading + paragraph'
                          : b.type}
                      </span>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <label className="small text-muted mb-0 d-flex align-items-center gap-1">
                          Cols (of 12)
                          <select
                            className="form-select form-select-sm"
                            style={{
                              borderRadius: 0,
                              width: 'auto',
                              minWidth: 64,
                            }}
                            value={b.cols}
                            onChange={(e) =>
                              updateBlock(i, {
                                cols: Number(e.target.value),
                              } as Partial<EditorBlock>)
                            }
                          >
                            {COL_OPTIONS.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary border-0"
                          onClick={() => moveBlock(i, -1)}
                          disabled={i === 0}
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary border-0"
                          onClick={() => moveBlock(i, 1)}
                          disabled={i === blocks.length - 1}
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0"
                          onClick={() => removeBlock(i)}
                          disabled={blocks.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {b.type === 'heading' && (
                      <input
                        type="text"
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        placeholder="Heading text"
                        value={b.value}
                        onChange={(e) =>
                          updateBlock(i, { value: e.target.value })
                        }
                      />
                    )}
                    {b.type === 'paragraph' && (
                      <textarea
                        className="form-control"
                        style={{ borderRadius: 0, minHeight: 100 }}
                        placeholder="Paragraph…"
                        value={b.value}
                        onChange={(e) =>
                          updateBlock(i, { value: e.target.value })
                        }
                      />
                    )}
                    {b.type === 'heading_para' && (
                      <>
                        <input
                          type="text"
                          className="form-control mb-2"
                          style={{ borderRadius: 0 }}
                          placeholder="Heading"
                          value={b.heading}
                          onChange={(e) =>
                            updateBlock(i, { heading: e.target.value })
                          }
                        />
                        <textarea
                          className="form-control"
                          style={{ borderRadius: 0, minHeight: 100 }}
                          placeholder="Paragraph…"
                          value={b.paragraph}
                          onChange={(e) =>
                            updateBlock(i, { paragraph: e.target.value })
                          }
                        />
                      </>
                    )}
                    {b.type === 'image' && (
                      <>
                        <input
                          type="file"
                          accept={ALLOWED_IMAGE_TYPES.join(',')}
                          className="form-control mb-2"
                          style={{ borderRadius: 0 }}
                          onChange={(e) =>
                            handleImageBlockFile(
                              i,
                              e.target.files?.[0] ?? null,
                            )
                          }
                        />
                        <input
                          type="text"
                          className="form-control mb-2"
                          style={{ borderRadius: 0 }}
                          placeholder="Alt text (optional)"
                          value={b.alt}
                          onChange={(e) =>
                            updateBlock(i, { alt: e.target.value })
                          }
                        />
                        {(b.imageUrl || b.localPreview) && (
                          <img
                            src={
                              b.localPreview ||
                              (b.imageUrl ? imageSrc(b.imageUrl) : '')
                            }
                            alt=""
                            style={{ maxHeight: 120, objectFit: 'cover' }}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  className="btn text-white mt-2"
                  style={{ backgroundColor: '#1a1f2e', borderRadius: 0 }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit for approval'}
                </button>
              </div>
            </div>
          </div>

          <div
            className={`col-lg-5 ${activeTab === 'edit' ? 'd-none d-lg-block' : ''}`}
          >
            <div
              className="card border-0 shadow-sm sticky-lg-top"
              style={{ top: '1rem', borderRadius: 0, maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
            >
              <div
                className="card-header py-2 px-3 fw-semibold"
                style={{
                  backgroundColor: '#1a1f2e',
                  color: '#fff',
                  borderRadius: 0,
                }}
              >
                Preview (as on public page)
              </div>
              <div className="card-body p-0">
                <section
                  className="w-100 position-relative d-flex align-items-center justify-content-center"
                  style={{
                    minHeight: 200,
                    maxHeight: 260,
                    overflow: 'hidden',
                    backgroundColor: '#1a1f2e',
                  }}
                >
                  {coverPreview && (
                    <img
                      src={coverPreview}
                      alt=""
                      className="position-absolute start-0 top-0 w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                  <div
                    className="position-absolute start-0 top-0 w-100 h-100"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(26,31,46,0.45) 0%, rgba(26,31,46,0.88) 100%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    className="position-relative text-center text-white px-3 py-4"
                    style={{ maxWidth: '100%', zIndex: 1 }}
                  >
                    <h2
                      className="h5 fw-bold mb-2"
                      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                    >
                      {previewHeroTitle}
                    </h2>
                    <p
                      className="small mb-0 opacity-90"
                      style={{
                        lineHeight: 1.4,
                        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                      }}
                    >
                      {previewHeroPara}
                    </p>
                  </div>
                </section>
                <div className="p-3">
                  <div className="row g-3">
                    {previewBlocks.length === 0 ? (
                      <p className="small text-muted mb-0">
                        Add blocks to see them here.
                      </p>
                    ) : (
                      previewBlocks.map((block, idx) => (
                        <BlogBlockRenderer
                          key={idx}
                          block={block}
                          imageSrcFn={(u) =>
                            u.startsWith('data:') ? u : imageSrc(u)
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </SubCategoryAdminLayout>
  );
};
