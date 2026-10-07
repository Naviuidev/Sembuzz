import { useState, useEffect, useRef, useMemo, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import { invalidateAdminActionItems } from '../services/admin-action-items.service';
import {
  subcategoryAdminBlogsService,
  type CreateBlogContentBlock,
} from '../services/subcategory-admin-blogs.service';
import { CreateBlogLivePreview } from '../components/CreateBlogLivePreview';
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

export type { ResubmitBlog };

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

export function SubCategoryAdminPostBlogPanel({
  embedded = false,
  hubHeader,
  resubmitBlog,
  onSubmitted,
}: {
  embedded?: boolean;
  hubHeader?: ReactNode;
  resubmitBlog?: ResubmitBlog;
  onSubmitted?: () => void;
}) {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useSubCategoryAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.subcategory } as CSSProperties;

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
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'web'>('mobile');
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
      await queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'blogs'] });
      void invalidateAdminActionItems(queryClient, 'subcategory-admin');
      if (onSubmitted) {
        onSubmitted();
      }
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

  const sectionHead = (num: number, titleText: string) => (
    <div className="admin-create-post-section__head">
      <span className="admin-create-post-section__num">{num}</span>
      <h2 className="admin-create-post-section__title">{titleText}</h2>
    </div>
  );

  const page = (
    <div
      className={`admin-create-post-page admin-create-post-page--blog${
        embedded ? ' admin-create-post-page--embedded' : ''
      }`}
      style={panelStyle}
    >
      {error ? (
        <div className="admin-notice mb-3">
          <p className="admin-form-hint admin-form-hint--error mb-0">{error}</p>
        </div>
      ) : null}

      <div
        className={`admin-create-post-layout admin-create-post-layout--blog${
          embedded && !hubHeader ? ' admin-create-post-layout--embedded' : ''
        }${hubHeader ? ' admin-create-post-layout--hub' : ''}`}
      >
        {hubHeader ? (
          <div className="admin-create-post-header admin-create-post-layout__header admin-create-post-layout__header--hub">
            {hubHeader}
          </div>
        ) : null}
        {!embedded && !hubHeader ? (
          <div className="admin-create-post-header admin-create-post-layout__header">
            <h1 className="admin-page-title">Post blog</h1>
            <p className="admin-page-subtitle mb-0">
              Build your article with blocks, preview it, then submit for category admin approval.
            </p>
          </div>
        ) : null}

        <form id="subcategory-admin-blog-form" className="admin-create-post-main" onSubmit={handleSubmit}>
          <section className="admin-panel admin-create-post-section" style={panelStyle}>
            <div className="admin-panel__body">
              {sectionHead(1, 'Audience & title')}
              <div className="admin-notice admin-notice--info mb-3">
                <p className="admin-form-label mb-1">Posting to subcategory</p>
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
                      className="form-select admin-form-control"
                      style={{ maxWidth: 320 }}
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
                <label className="admin-form-label" htmlFor="sca-blog-title">Title</label>
                <input
                  id="sca-blog-title"
                  type="text"
                  className="form-control admin-form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={500}
                  placeholder="Blog title"
                />
              </div>
            </div>
          </section>

          <section className="admin-panel admin-create-post-section" style={panelStyle}>
            <div className="admin-panel__body">
              {sectionHead(2, 'Banner & listing')}
              <p className="admin-form-hint mb-3">Hero text appears over the cover on the public blog page.</p>
              <div className="mb-3">
                <label className="admin-form-label" htmlFor="sca-blog-hero-title">Banner headline</label>
                <input
                  id="sca-blog-hero-title"
                  type="text"
                  className="form-control admin-form-control mb-2"
                  placeholder="Defaults to title if empty"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  maxLength={300}
                />
                <label className="admin-form-label" htmlFor="sca-blog-hero-para">Banner subtitle</label>
                <textarea
                  id="sca-blog-hero-para"
                  className="form-control admin-form-control mb-2"
                  style={{ minHeight: 72 }}
                  placeholder="Banner subtitle"
                  value={heroParagraph}
                  onChange={(e) => setHeroParagraph(e.target.value)}
                />
                <div className="row g-2">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control admin-form-control"
                      placeholder="Button label (optional)"
                      value={heroButtonText}
                      onChange={(e) => setHeroButtonText(e.target.value)}
                      maxLength={120}
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control admin-form-control"
                      placeholder="Button link URL or path"
                      value={heroButtonLink}
                      onChange={(e) => setHeroButtonLink(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="admin-form-label" htmlFor="sca-blog-cover">Cover image (optional)</label>
                <input
                  id="sca-blog-cover"
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  className="form-control admin-form-control"
                  onChange={handleCoverChange}
                />
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt=""
                    className="mt-2"
                    style={{ maxHeight: 140, objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : null}
              </div>
              <div className="mb-0">
                <label className="admin-form-label" htmlFor="sca-blog-summary">Listing summary (optional)</label>
                <textarea
                  id="sca-blog-summary"
                  className="form-control admin-form-control"
                  style={{ minHeight: 80 }}
                  placeholder="Short text for blog cards. If empty, text is taken from your blocks."
                  value={listingSummary}
                  onChange={(e) => setListingSummary(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="admin-panel admin-create-post-section" style={panelStyle}>
            <div className="admin-panel__body">
              {sectionHead(3, 'Article blocks')}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => addBlock('heading')}>
                  + Heading
                </button>
                <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => addBlock('paragraph')}>
                  + Paragraph
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary admin-btn-sm"
                  onClick={() => addBlock('heading_para')}
                >
                  + Heading + paragraph
                </button>
                <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => addBlock('image')}>
                  + Image
                </button>
              </div>
              <p className="admin-form-hint mb-3">
                Blocks use a 12-column grid. Column width 6 = half width on desktop.
              </p>

              {blocks.map((b, i) => (
                  <div key={b.id} className="admin-notice mb-3">
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
                          className="admin-btn-secondary admin-btn-sm"
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
                        className="form-control admin-form-control"
                        placeholder="Heading text"
                        value={b.value}
                        onChange={(e) =>
                          updateBlock(i, { value: e.target.value })
                        }
                      />
                    )}
                    {b.type === 'paragraph' && (
                      <textarea
                        className="form-control admin-form-control"
                        style={{ minHeight: 100 }}
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
                          className="form-control admin-form-control mb-2"
                          placeholder="Heading"
                          value={b.heading}
                          onChange={(e) =>
                            updateBlock(i, { heading: e.target.value })
                          }
                        />
                        <textarea
                          className="form-control admin-form-control"
                          style={{ minHeight: 100 }}
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
                          className="form-control admin-form-control mb-2"
                          onChange={(e) =>
                            handleImageBlockFile(
                              i,
                              e.target.files?.[0] ?? null,
                            )
                          }
                        />
                        <input
                          type="text"
                          className="form-control admin-form-control mb-2"
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
            </div>
          </section>
        </form>

        <aside className="admin-create-post-preview-col">
          <div className="admin-create-post-preview-card">
            <h2 className="admin-panel__title mb-2" style={{ fontSize: '1rem' }}>Live Preview</h2>
            <div className="admin-create-post-preview-toggle" role="tablist" aria-label="Preview size">
              <button
                type="button"
                role="tab"
                aria-selected={previewMode === 'mobile'}
                className={previewMode === 'mobile' ? 'is-active' : ''}
                onClick={() => setPreviewMode('mobile')}
              >
                Mobile
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={previewMode === 'tablet'}
                className={previewMode === 'tablet' ? 'is-active' : ''}
                onClick={() => setPreviewMode('tablet')}
              >
                Tablet
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={previewMode === 'web'}
                className={previewMode === 'web' ? 'is-active' : ''}
                onClick={() => setPreviewMode('web')}
              >
                Web
              </button>
            </div>
            <CreateBlogLivePreview
              heroTitle={previewHeroTitle}
              heroParagraph={previewHeroPara}
              coverSrc={coverPreview}
              heroButtonText={heroButtonText}
              heroButtonLink={heroButtonLink}
              blocks={previewBlocks}
              previewMode={previewMode}
              imageSrcFn={(u) => (u.startsWith('data:') ? u : imageSrc(u))}
            />
            <div className="admin-create-post-tip">
              <i className="bi bi-lightbulb" aria-hidden />
              Use a strong title, cover image, and clear blocks so students engage with your blog.
            </div>
          </div>
        </aside>
      </div>

      <div className="admin-create-post-footer" style={panelStyle}>
        <div className="admin-create-post-footer__actions ms-auto">
          <button
            type="submit"
            form="subcategory-admin-blog-form"
            className="admin-btn-primary"
            disabled={submitting}
          >
            <i className="bi bi-send me-2" aria-hidden />
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) return page;
  return <SubCategoryAdminLayout>{page}</SubCategoryAdminLayout>;
};

export const SubCategoryAdminPostBlog = () => {
  const location = useLocation();
  const resubmitBlog = (location.state as { resubmitBlog?: ResubmitBlog })?.resubmitBlog;

  return <SubCategoryAdminPostBlogPanel resubmitBlog={resubmitBlog} />;
};
