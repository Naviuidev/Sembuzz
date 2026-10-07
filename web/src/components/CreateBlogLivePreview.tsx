import { BlogBlockRenderer } from './BlogBlockRenderer';
import type { ContentBlock } from '../services/public-blogs.service';

function BlogPreviewBody({
  heroTitle,
  heroParagraph,
  coverSrc,
  heroButtonText,
  heroButtonLink,
  blocks,
  imageSrcFn,
  compact,
}: {
  heroTitle: string;
  heroParagraph: string;
  coverSrc: string | null;
  heroButtonText: string;
  heroButtonLink: string;
  blocks: ContentBlock[];
  imageSrcFn: (url: string) => string;
  compact: boolean;
}) {
  const resolvedCover =
    coverSrc && !coverSrc.startsWith('data:') ? imageSrcFn(coverSrc) : coverSrc;

  return (
    <div className={`admin-create-post-preview-blog${compact ? ' admin-create-post-preview-blog--compact' : ''}`}>
      <section className="admin-create-post-preview-blog__hero" aria-hidden>
        {resolvedCover ? (
          <img src={resolvedCover} alt="" className="admin-create-post-preview-blog__hero-img" />
        ) : null}
        <div className="admin-create-post-preview-blog__hero-overlay" />
        <div className="admin-create-post-preview-blog__hero-text">
          <h2 className="admin-create-post-preview-blog__hero-title">{heroTitle}</h2>
          <p className="admin-create-post-preview-blog__hero-sub">{heroParagraph}</p>
          {heroButtonText.trim() && heroButtonLink.trim() ? (
            <span className="admin-create-post-preview-blog__hero-btn">{heroButtonText}</span>
          ) : null}
        </div>
      </section>
      <div className="admin-create-post-preview-blog__body">
        {blocks.length === 0 ? (
          <p className="admin-create-post-preview-blog__empty">Add blocks to see them here.</p>
        ) : (
          <div className="row g-3">
            {blocks.map((block, idx) => (
              <BlogBlockRenderer key={idx} block={block} imageSrcFn={imageSrcFn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CreateBlogLivePreview({
  heroTitle,
  heroParagraph,
  coverSrc,
  heroButtonText,
  heroButtonLink,
  blocks,
  previewMode,
  imageSrcFn,
}: {
  heroTitle: string;
  heroParagraph: string;
  coverSrc: string | null;
  heroButtonText: string;
  heroButtonLink: string;
  blocks: ContentBlock[];
  previewMode: 'mobile' | 'tablet' | 'web';
  imageSrcFn: (url: string) => string;
}) {
  const compact = previewMode !== 'web';
  const body = (
    <BlogPreviewBody
      heroTitle={heroTitle}
      heroParagraph={heroParagraph}
      coverSrc={coverSrc}
      heroButtonText={heroButtonText}
      heroButtonLink={heroButtonLink}
      blocks={blocks}
      imageSrcFn={imageSrcFn}
      compact={compact}
    />
  );

  if (previewMode === 'web') {
    return (
      <div className="admin-create-post-preview-stage">
        <div className="admin-create-post-preview-device admin-create-post-preview-device--web">
          <div className="admin-create-post-preview-device__browser-bar">
            <span className="admin-create-post-preview-device__browser-dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span className="admin-create-post-preview-device__browser-url">sembuzz.com/blogs</span>
          </div>
          <div className="admin-create-post-preview-device__body admin-create-post-preview-device__body--web">
            {body}
          </div>
        </div>
      </div>
    );
  }

  if (previewMode === 'tablet') {
    return (
      <div className="admin-create-post-preview-stage">
        <div className="admin-create-post-preview-device admin-create-post-preview-device--tablet">
          <div className="admin-create-post-preview-device__screen">
            <div className="admin-create-post-preview-device__tablet-bar">
              <span className="admin-create-post-preview-device__tablet-time">9:41</span>
              <span className="admin-create-post-preview-device__tablet-brand">SemBuzz</span>
              <span className="admin-create-post-preview-device__tablet-icons" aria-hidden>
                <i className="bi bi-wifi" />
                <i className="bi bi-battery-full" />
              </span>
            </div>
            <div className="admin-create-post-preview-device__body">{body}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-create-post-preview-stage">
      <div className="admin-create-post-preview-device admin-create-post-preview-device--iphone">
        <div className="admin-create-post-preview-device__screen">
          <div className="admin-create-post-preview-device__iphone-status">
            <span className="admin-create-post-preview-device__iphone-time">9:41</span>
            <div className="admin-create-post-preview-device__dynamic-island" aria-hidden />
            <span className="admin-create-post-preview-device__iphone-icons" aria-hidden>
              <i className="bi bi-reception-4" />
              <i className="bi bi-wifi" />
              <i className="bi bi-battery-full" />
            </span>
          </div>
          <div className="admin-create-post-preview-device__body">{body}</div>
        </div>
      </div>
    </div>
  );
}
