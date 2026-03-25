import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { EventsBottomNav } from '../components/EventsBottomNav';
import { useUserAuth } from '../contexts/UserAuthContext';
import { userNotificationsService, USER_NOTIFICATIONS_UNREAD_QUERY_KEY } from '../services/user-notifications.service';
import {
  publicBlogsService,
  type PublishedBlogListItem,
} from '../services/public-blogs.service';
import { imageSrc } from '../utils/image';

function excerpt(text: string, max = 160): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + '…';
}

function parseImageUrls(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function blogImage(blog: PublishedBlogListItem): string {
  if (blog.coverImageUrl) return imageSrc(blog.coverImageUrl);
  const fallback = parseImageUrls((blog as PublishedBlogListItem & { imageUrls?: string | null }).imageUrls)[0];
  return fallback ? imageSrc(fallback) : '';
}

const ALL_CATEGORY = 'all';
const ALL_SCHOOL = 'all';

export const PublicBlogs = () => {
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const [searchParams] = useSearchParams();
  /** Optional URL filter; omit to list blogs from all schools (browse by school in sidebar). */
  const schoolIdFromUrl = searchParams.get('schoolId') || undefined;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ALL_CATEGORY);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(ALL_SCHOOL);
  const [categorySearch, setCategorySearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [filterDropdown, setFilterDropdown] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: blogs = [], isLoading, error } = useQuery({
    queryKey: ['public', 'blogs', schoolIdFromUrl ?? 'all', debouncedSearch],
    queryFn: () =>
      publicBlogsService.list({
        schoolId: schoolIdFromUrl,
        q: debouncedSearch || undefined,
      }),
  });

  const { data: unreadNotifData } = useQuery({
    queryKey: USER_NOTIFICATIONS_UNREAD_QUERY_KEY,
    queryFn: () => userNotificationsService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 15_000,
  });
  const notifUnreadCount = unreadNotifData?.unreadCount ?? 0;

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    blogs.forEach((b) => {
      if (b.subCategory?.id && b.subCategory?.name && !seen.has(b.subCategory.id)) {
        seen.set(b.subCategory.id, b.subCategory.name);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [blogs]);

  const schools = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; image: string | null }>();
    blogs.forEach((b) => {
      if (b.school?.id && !seen.has(b.school.id)) {
        seen.set(b.school.id, {
          id: b.school.id,
          name: b.school.name,
          image: b.school.image,
        });
      }
    });
    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }, [blogs]);

  const categoryQuery = categorySearch.trim().toLowerCase();
  const filteredCategoryList = useMemo(() => {
    if (!categoryQuery) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(categoryQuery));
  }, [categories, categoryQuery]);

  const schoolQuery = schoolSearch.trim().toLowerCase();
  const filteredSchoolList = useMemo(() => {
    if (!schoolQuery) return schools;
    return schools.filter((s) => s.name.toLowerCase().includes(schoolQuery));
  }, [schools, schoolQuery]);

  const filteredBlogs = useMemo(() => {
    let list = blogs;
    if (selectedCategoryId !== ALL_CATEGORY) {
      list = list.filter((b) => b.subCategory?.id === selectedCategoryId);
    }
    if (selectedSchoolId !== ALL_SCHOOL) {
      list = list.filter((b) => b.school?.id === selectedSchoolId);
    }
    if (filterDropdown === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.publishedAt || a.createdAt).getTime() - new Date(b.publishedAt || b.createdAt).getTime());
    } else if (filterDropdown === 'recent') {
      list = [...list].sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
    }
    return list;
  }, [blogs, selectedCategoryId, selectedSchoolId, filterDropdown]);

  const featuredBlog = filteredBlogs[0];
  const gridBlogs = filteredBlogs.slice(1);

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f4f5f7', paddingBottom: '5.5rem' }}>
      <Navbar />

      {/* Header: pill + H1 + subtext */}
      <div className="container py-4 py-md-5 text-center">
        <span
          className="d-inline-block px-3 py-1 mb-3 rounded-pill"
          style={{
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            color: '#4f5aaa',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          Read Our Blog
        </span>
        <h1
          className="mb-2"
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            color: '#1a1f2e',
            fontWeight: 700,
          }}
        >
          Browse Our Resources
        </h1>
        <p
          className="text-muted mx-auto mb-0"
          style={{ maxWidth: 520, fontSize: '1.05rem' }}
        >
          We provide tips and resources from industry leaders. For real.
        </p>
      </div>

      <div className="container pb-5">
        <div className="row g-4 g-lg-5">
          {/* Left sidebar: fixed so it doesn’t scroll with the page */}
          <aside
            className="col-lg-3 order-2 order-lg-1"
            style={{
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'sticky',
                top: '1rem',
                maxHeight: 'calc(100vh - 2rem)',
                overflowY: 'auto',
              }}
            >
              <div className="mb-4">
                <label className="form-label small fw-semibold text-secondary">
                  Search articles
                </label>
                <div className="position-relative">
                  <i
                    className="bi bi-search position-absolute text-muted"
                    style={{
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '1rem',
                    }}
                    aria-hidden
                  />
                  <input
                    type="search"
                    className="form-control ps-4"
                    placeholder="Search by title or content…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ borderRadius: 12 }}
                    aria-label="Search blogs"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold text-secondary">
                  Filter
                </label>
                <select
                  className="form-select"
                  value={filterDropdown}
                  onChange={(e) => setFilterDropdown(e.target.value)}
                  style={{ borderRadius: 12 }}
                  aria-label="Filter articles"
                >
                  <option value="">Filter article…</option>
                  <option value="recent">Most recent</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
              <div className="mb-4">
                <div className="small fw-semibold text-secondary mb-2">
                  Browse by categories
                </div>
                <div className="position-relative mb-2">
                  <i
                    className="bi bi-search position-absolute text-muted"
                    style={{
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.85rem',
                    }}
                    aria-hidden
                  />
                  <input
                    type="search"
                    className="form-control form-control-sm ps-4"
                    placeholder="Search categories…"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    style={{ borderRadius: 10 }}
                    aria-label="Filter category list"
                  />
                </div>
                <ul className="list-unstyled mb-0 small">
                  <li>
                    <button
                      type="button"
                      className="btn btn-link text-start p-0 text-decoration-none d-block w-100 py-2 border-0 bg-transparent"
                      style={{
                        color: selectedCategoryId === ALL_CATEGORY ? '#0d6efd' : '#2c3338',
                        fontWeight: selectedCategoryId === ALL_CATEGORY ? 600 : 400,
                        borderLeft: selectedCategoryId === ALL_CATEGORY ? '3px solid #0d6efd' : '3px solid transparent',
                        paddingLeft: selectedCategoryId === ALL_CATEGORY ? '0.75rem' : 'calc(0.75rem + 3px)',
                      }}
                      onClick={() => setSelectedCategoryId(ALL_CATEGORY)}
                    >
                      All categories
                    </button>
                  </li>
                  {filteredCategoryList.map((cat) => (
                    <li key={cat.id}>
                      <button
                        type="button"
                        className="btn btn-link text-start p-0 text-decoration-none d-block w-100 py-2 border-0 bg-transparent"
                        style={{
                          color: selectedCategoryId === cat.id ? '#0d6efd' : '#2c3338',
                          fontWeight: selectedCategoryId === cat.id ? 600 : 400,
                          borderLeft: selectedCategoryId === cat.id ? '3px solid #0d6efd' : '3px solid transparent',
                          paddingLeft: selectedCategoryId === cat.id ? '0.75rem' : 'calc(0.75rem + 3px)',
                        }}
                        onClick={() => setSelectedCategoryId(cat.id)}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
                {categoryQuery && filteredCategoryList.length === 0 && (
                  <p className="text-muted small mb-0 mt-1">No matching categories.</p>
                )}
              </div>

              <div>
                <div className="small fw-semibold text-secondary mb-2">
                  Browse by school
                </div>
                <div className="position-relative mb-2">
                  <i
                    className="bi bi-search position-absolute text-muted"
                    style={{
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.85rem',
                    }}
                    aria-hidden
                  />
                  <input
                    type="search"
                    className="form-control form-control-sm ps-4"
                    placeholder="Search schools…"
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    style={{ borderRadius: 10 }}
                    aria-label="Filter school list"
                  />
                </div>
                <ul className="list-unstyled mb-0 small">
                  <li>
                    <button
                      type="button"
                      className="btn btn-link text-start p-0 text-decoration-none d-block w-100 py-2 border-0 bg-transparent d-flex align-items-center gap-2"
                      style={{
                        color: selectedSchoolId === ALL_SCHOOL ? '#0d6efd' : '#2c3338',
                        fontWeight: selectedSchoolId === ALL_SCHOOL ? 600 : 400,
                        borderLeft: selectedSchoolId === ALL_SCHOOL ? '3px solid #0d6efd' : '3px solid transparent',
                        paddingLeft: selectedSchoolId === ALL_SCHOOL ? '0.75rem' : 'calc(0.75rem + 3px)',
                      }}
                      onClick={() => setSelectedSchoolId(ALL_SCHOOL)}
                    >
                      All schools
                    </button>
                  </li>
                  {filteredSchoolList.map((sch) => (
                    <li key={sch.id}>
                      <button
                        type="button"
                        className="btn btn-link text-start p-0 text-decoration-none d-block w-100 py-2 border-0 bg-transparent d-flex align-items-center gap-2"
                        style={{
                          color: selectedSchoolId === sch.id ? '#0d6efd' : '#2c3338',
                          fontWeight: selectedSchoolId === sch.id ? 600 : 400,
                          borderLeft: selectedSchoolId === sch.id ? '3px solid #0d6efd' : '3px solid transparent',
                          paddingLeft: selectedSchoolId === sch.id ? '0.75rem' : 'calc(0.75rem + 3px)',
                        }}
                        onClick={() => setSelectedSchoolId(sch.id)}
                      >
                        {sch.image ? (
                          <img
                            src={imageSrc(sch.image)}
                            alt=""
                            width={22}
                            height={22}
                            className="rounded-circle flex-shrink-0"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <span
                            className="rounded-circle flex-shrink-0 d-inline-flex align-items-center justify-content-center text-white"
                            style={{
                              width: 22,
                              height: 22,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              backgroundColor: '#6c757d',
                            }}
                          >
                            {sch.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="text-truncate">{sch.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {schoolQuery && filteredSchoolList.length === 0 && (
                  <p className="text-muted small mb-0 mt-1">No matching schools.</p>
                )}
                {schools.length === 0 && !isLoading && (
                  <p className="text-muted small mb-0 mt-1">Schools appear as blogs load.</p>
                )}
              </div>
            </div>
          </aside>

          {/* Main: featured card + grid */}
          <div className="col-lg-9 order-1 order-lg-2">
            {isLoading && (
              <p className="text-muted py-5">Loading blogs…</p>
            )}
            {error && (
              <div className="py-5 px-3">
                <p className="text-danger mb-2">Could not load blogs.</p>
                <p className="text-muted small">
                  Check that the API is running and migrations are applied.
                </p>
              </div>
            )}
            {!isLoading && !error && filteredBlogs.length === 0 && (
              <p className="text-muted py-5">
                No published blogs match your filters yet.
              </p>
            )}

            {!isLoading && !error && filteredBlogs.length > 0 && (
              <>
                {/* Featured blog (first) — large card */}
                {featuredBlog && (
                  <Link
                    to={`/blogs/${featuredBlog.id}`}
                    className="text-decoration-none d-block mb-4 mb-md-5"
                    style={{ color: 'inherit' }}
                  >
                    <article
                      className="card border-0 shadow-sm overflow-hidden blog-card-hover"
                      style={{
                        borderRadius: 16,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                    >
                      <div className="row g-0 align-items-stretch">
                        <div className="col-md-5 d-flex">
                          <div
                            className="ratio ratio-16x10 ratio-md-1x1 bg-light w-100"
                            style={{ minHeight: '100%' }}
                          >
                            {blogImage(featuredBlog) ? (
                              <img
                                src={blogImage(featuredBlog)}
                                alt=""
                                className="object-fit-cover"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center text-muted">
                                <i className="bi bi-journal-richtext" style={{ fontSize: '3rem' }} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-7 d-flex flex-column">
                          <div className="card-body p-4 p-lg-5 d-flex flex-column justify-content-center">
                            <span
                              className="d-inline-block px-2 py-1 mb-2 rounded"
                              style={{
                                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                                color: '#4f5aaa',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              Featured
                            </span>
                            <h2
                              className="h4 mb-3"
                              style={{ color: '#1a1f2e', fontWeight: 700, lineHeight: 1.3 }}
                            >
                              {featuredBlog.title}
                            </h2>
                            <p className="text-muted mb-3" style={{ lineHeight: 1.6 }}>
                              {excerpt(featuredBlog.content, 180)}
                            </p>
                            <div className="d-flex align-items-center gap-2 small text-muted mt-auto">
                              {featuredBlog.subCategoryAdmin?.name && (
                                <>
                                  <span
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      backgroundColor: '#e9ecef',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 600,
                                      color: '#1a1f2e',
                                    }}
                                  >
                                    {featuredBlog.subCategoryAdmin.name.charAt(0)}
                                  </span>
                                  <span>{featuredBlog.subCategoryAdmin.name}</span>
                                </>
                              )}
                              <span>·</span>
                              <span>5min read</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                )}

                {/* Grid of remaining blogs — 2 columns */}
                <div className="row g-4">
                  {gridBlogs.map((b: PublishedBlogListItem) => (
                    <div key={b.id} className="col-12 col-md-6">
                      <Link
                        to={`/blogs/${b.id}`}
                        className="text-decoration-none h-100 d-block"
                        style={{ color: 'inherit' }}
                      >
                        <article
                          className="card h-100 border-0 shadow-sm overflow-hidden blog-card-hover"
                          style={{
                            borderRadius: 16,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          }}
                        >
                          <div
                            className="ratio ratio-16x9 bg-light"
                            style={{ backgroundColor: '#e9ecef' }}
                          >
                            {blogImage(b) ? (
                              <img
                                src={blogImage(b)}
                                alt=""
                                className="object-fit-cover"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="d-flex align-items-center justify-content-center text-muted">
                                <i className="bi bi-journal-richtext" style={{ fontSize: '2.5rem' }} />
                              </div>
                            )}
                          </div>
                          <div className="card-body p-4">
                            <span
                              className="small d-block mb-2"
                              style={{ color: '#4f5aaa', fontWeight: 600 }}
                            >
                              {b.subCategory?.name ?? 'Blog'}
                            </span>
                            <h3 className="h6 mb-2" style={{ color: '#1a1f2e', fontWeight: 600 }}>
                              {b.title}
                            </h3>
                            <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
                              {excerpt(b.content)}
                            </p>
                            <div className="d-flex justify-content-between align-items-center small">
                              <span className="d-flex align-items-center gap-2 text-muted">
                                <span
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: '#e9ecef',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    color: '#1a1f2e',
                                  }}
                                >
                                  {b.subCategoryAdmin?.name?.charAt(0) ?? '?'}
                                </span>
                                {b.subCategoryAdmin?.name ?? 'Author'}
                              </span>
                              <span className="text-muted">5min read</span>
                              <i className="bi bi-arrow-up-right text-muted" />
                            </div>
                          </div>
                        </article>
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .blog-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(26,31,46,0.12) !important;
        }
      `}</style>

      <EventsBottomNav
        activeTab="blogs"
        onSelectTab={(tab) => {
          if (tab === 'blogs') return;
          navigate('/events', { state: { bottomNav: tab } });
        }}
        notifUnreadCount={notifUnreadCount}
      />
    </div>
  );
};
