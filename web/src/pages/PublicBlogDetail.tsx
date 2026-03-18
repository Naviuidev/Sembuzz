import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { publicBlogsService } from '../services/public-blogs.service';
import { imageSrc } from '../utils/image';
import { BlogBlockRenderer } from '../components/BlogBlockRenderer';
import type { ContentBlock } from '../services/public-blogs.service';

function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function formatPubDate(iso: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function excerpt(text: string, max = 200): string {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + '…';
}

export const PublicBlogDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ['public', 'blog', id],
    queryFn: () => publicBlogsService.getById(id!),
    enabled: !!id,
  });

  const { data: allBlogs = [] } = useQuery({
    queryKey: ['public', 'blogs', 'sidebar'],
    queryFn: () => publicBlogsService.list({}),
    enabled: !!blog,
  });

  const featuredBlogs = allBlogs.filter((b) => b.id !== id).slice(0, 5);
  const extraImages = blog ? parseImageUrls(blog.imageUrls) : [];

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#fafafa' }}>
      <Navbar />
      {isLoading && (
        <div className="container py-5 text-center text-muted">Loading…</div>
      )}
      {error && (
        <div className="container py-5 text-center">
          <p className="text-danger mb-3">Blog not found or no longer published.</p>
          <Link
            to="/blogs"
            className="btn btn-dark"
            style={{ borderRadius: 999 }}
          >
            Back to blogs
          </Link>
        </div>
      )}
      {blog && !error && (
        <>
          {/* Banner with hero overlay: H1, paragraph, button on background image */}
          <section
            className="w-100 position-relative d-flex align-items-center justify-content-center"
            style={{
              minHeight: 'min(48vh, 420px)',
              maxHeight: 'min(52vh, 480px)',
              overflow: 'hidden',
              backgroundColor: '#1a1f2e',
            }}
          >
            {blog.coverImageUrl && (
              <img
                src={imageSrc(blog.coverImageUrl)}
                alt=""
                className="position-absolute start-0 top-0 w-100 h-100"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
            )}
            <div
              className="position-absolute start-0 top-0 w-100 h-100"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(26,31,46,0.4) 0%, rgba(26,31,46,0.85) 100%)',
                pointerEvents: 'none',
              }}
            />
            <div
              className="position-relative text-center text-white px-3 py-5"
              style={{ maxWidth: 720, zIndex: 1 }}
            >
              <h1
                className="display-5 fw-bold mb-3"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
              >
                {blog.heroTitle || blog.title}
              </h1>
              {(blog.heroParagraph || blog.content) && (
                <p
                  className="lead mb-4 opacity-90"
                  style={{
                    fontSize: '1.1rem',
                    lineHeight: 1.5,
                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  }}
                >
                  {blog.heroParagraph || excerpt(blog.content, 220)}
                </p>
              )}
              {(blog.heroButtonText || blog.heroButtonLink) &&
                (blog.heroButtonLink?.startsWith('http') ? (
                  <a
                    href={blog.heroButtonLink}
                    className="btn btn-light btn-lg px-4"
                    style={{ borderRadius: 999 }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {blog.heroButtonText || 'Read more'}
                  </a>
                ) : (
                  <Link
                    to={blog.heroButtonLink || '/blogs'}
                    className="btn btn-light btn-lg px-4"
                    style={{ borderRadius: 999 }}
                  >
                    {blog.heroButtonText || 'Read more'}
                  </Link>
                ))}
            </div>
          </section>

          <div className="container py-4 py-md-5">
            <div className="row g-4 g-lg-5">
              {/* Main content */}
              <div className="col-lg-8">
                <Link
                  to="/blogs"
                  className="small text-decoration-none d-inline-flex align-items-center gap-1 mb-3"
                  style={{ color: '#6c757d' }}
                >
                  <i className="bi bi-arrow-left" />
                  All blogs
                </Link>

                <div className="small text-muted mb-2">
                  {blog.school?.name}
                  {blog.subCategory?.name && (
                    <> · <span>{blog.subCategory.name}</span></>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-3 small text-muted mb-4">
                  {blog.subCategoryAdmin?.name && (
                    <span>
                      <i className="bi bi-person me-1" />
                      {blog.subCategoryAdmin.name}
                    </span>
                  )}
                  <span>
                    <i className="bi bi-calendar3 me-1" />
                    {formatPubDate(blog.publishedAt)}
                  </span>
                </div>

                {blog.contentBlocks && blog.contentBlocks.length > 0 ? (
                  <div className="row g-3 g-md-4">
                    {blog.contentBlocks.map((block, idx) => (
                      <BlogBlockRenderer
                        key={idx}
                        block={block as ContentBlock}
                        imageSrcFn={imageSrc}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <div
                      className="blog-body fs-6 mb-4"
                      style={{
                        color: '#2c3338',
                        lineHeight: 1.75,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {blog.content}
                    </div>
                    {extraImages.length > 0 && (
                      <div className="pt-4 border-top">
                        <h2 className="h6 text-uppercase text-muted mb-3">
                          Gallery
                        </h2>
                        <div className="row g-3">
                          {extraImages.map((url, i) => (
                            <div key={i} className="col-12 col-md-6">
                              <a
                                href={imageSrc(url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="d-block rounded-3 overflow-hidden shadow-sm"
                              >
                                <img
                                  src={imageSrc(url)}
                                  alt=""
                                  className="w-100"
                                  style={{
                                    objectFit: 'cover',
                                    maxHeight: 280,
                                  }}
                                />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sidebar: Featured blogs */}
              <aside className="col-lg-4">
                <div
                  className="card border-0 sticky-top bg-transparent"
                  style={{
                    top: '1rem',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="card-header border-0 bg-transparent py-3 px-0 px-md-1"
                    style={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: '#1a1f2e',
                    }}
                  >
                    Recent articles
                  </div>
                  <ul className="list-group list-group-flush">
                    {featuredBlogs.length === 0 && (
                      <li className="list-group-item small text-muted">
                        No other blogs yet.
                      </li>
                    )}
                    {featuredBlogs.map((b) => (
                      <li
                        key={b.id}
                        className="list-group-item border-0 px-3 px-md-4 py-3"
                      >
                        <Link
                          to={`/blogs/${b.id}`}
                          className="text-decoration-none d-flex align-items-start gap-3"
                          style={{ color: '#1a1f2e' }}
                        >
                          <div
                            className="flex-shrink-0 rounded overflow-hidden bg-light"
                            style={{
                              width: '32%',
                              maxWidth: 112,
                              aspectRatio: '1 / 1',
                            }}
                          >
                            {b.coverImageUrl ? (
                              <img
                                src={imageSrc(b.coverImageUrl)}
                                alt=""
                                className="w-100 h-100"
                                style={{ objectFit: 'cover', display: 'block' }}
                              />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                <i className="bi bi-journal-text fs-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-grow-1">
                            <span
                              className="d-block fw-bold text-break mb-2"
                              style={{
                                fontSize: '0.95rem',
                                lineHeight: 1.35,
                                color: '#1a1f2e',
                              }}
                            >
                              {b.title}
                            </span>
                            <div className="d-flex align-items-center gap-2">
                              {b.school?.image ? (
                                <img
                                  src={imageSrc(b.school.image)}
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="rounded-circle flex-shrink-0"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <span
                                  className="rounded-circle flex-shrink-0 d-inline-flex align-items-center justify-content-center text-white small fw-semibold"
                                  style={{
                                    width: 28,
                                    height: 28,
                                    fontSize: '0.7rem',
                                    backgroundColor: '#6c757d',
                                  }}
                                >
                                  {(b.school?.name || '?').charAt(0).toUpperCase()}
                                </span>
                              )}
                              <span
                                className="small text-muted text-truncate"
                                style={{ fontWeight: 400 }}
                              >
                                {b.school?.name || 'School'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
