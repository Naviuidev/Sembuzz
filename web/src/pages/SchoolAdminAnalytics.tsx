import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { publicEventsService, type CategoryPublic } from '../services/public-events.service';
import { schoolAdminPostsService, type SchoolAdminPost } from '../services/school-admin-posts.service';
import { imageSrc } from '../utils/image';

function parseFirstImageUrl(imageUrls: string | null): string | null {
  if (!imageUrls) return null;
  try {
    const arr = JSON.parse(imageUrls) as unknown;
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') return arr[0];
  } catch {
    // ignore
  }
  return null;
}

const DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
];

export const SchoolAdminAnalytics = () => {
  const { user } = useSchoolAdminAuth();
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [posts, setPosts] = useState<SchoolAdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterSubCategoryId, setFilterSubCategoryId] = useState('');
  const [filterPostId, setFilterPostId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState('7');
  const [graphView, setGraphView] = useState<'line' | 'bar' | 'donut'>('line');
  const [chartTooltip, setChartTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!user?.schoolId) return;
    Promise.all([
      publicEventsService.getCategoriesBySchool(user.schoolId),
      schoolAdminPostsService.getPosts().catch(() => []),
    ])
      .then(([cats, postList]) => {
        setCategories(cats);
        setPosts(postList);
      })
      .finally(() => setLoading(false));
  }, [user?.schoolId]);

  const selectedCategory = categories.find((c) => c.id === filterCategoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  useEffect(() => {
    if (!subcategories.some((s) => s.id === filterSubCategoryId)) {
      setFilterSubCategoryId(subcategories[0]?.id ?? '');
    }
  }, [filterCategoryId, subcategories, filterSubCategoryId]);

  // When category/subcategory change, clear post filter if selected post is no longer in the filtered list
  const filteredPosts = posts.filter((p) => {
    if (filterCategoryId && p.subCategory?.category?.id !== filterCategoryId) return false;
    if (filterSubCategoryId && p.subCategory?.id !== filterSubCategoryId) return false;
    return true;
  });
  useEffect(() => {
    if (filterPostId && !filteredPosts.some((p) => p.id === filterPostId)) {
      setFilterPostId('');
    }
  }, [filterPostId, filteredPosts]);

  const postsToShow = filterPostId
    ? filteredPosts.filter((p) => p.id === filterPostId)
    : filteredPosts;
  const postIds = useMemo(() => postsToShow.map((p) => p.id), [postsToShow]);

  const { dateFrom: queryDateFrom, dateTo: queryDateTo } = useMemo(() => {
    if (dateRangePreset === 'custom') {
      if (filterDateFrom && filterDateTo) {
        return { dateFrom: filterDateFrom, dateTo: filterDateTo };
      }
      return { dateFrom: undefined, dateTo: undefined };
    }
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const days = parseInt(dateRangePreset, 10) || 7;
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    return {
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
    };
  }, [dateRangePreset, filterDateFrom, filterDateTo]);

  const { data: engagement } = useQuery({
    queryKey: ['school-admin', 'analytics', 'engagement', postIds.join(','), queryDateFrom ?? '', queryDateTo ?? ''],
    queryFn: () =>
      publicEventsService.getEngagementCounts(postIds, {
        ...(queryDateFrom && queryDateTo ? { dateFrom: queryDateFrom, dateTo: queryDateTo } : {}),
      }),
    enabled: postIds.length > 0,
  });

  const likesMap = engagement?.likes ?? {};
  const commentCountsMap = engagement?.commentCounts ?? {};
  const savedCountsMap = engagement?.savedCounts ?? {};
  const totalLikes = useMemo(() => Object.values(likesMap).reduce((a, b) => a + b, 0), [likesMap]);
  const totalComments = useMemo(
    () => Object.values(commentCountsMap).reduce((a, b) => a + b, 0),
    [commentCountsMap],
  );
  const totalSaved = useMemo(
    () => Object.values(savedCountsMap).reduce((a, b) => a + b, 0),
    [savedCountsMap],
  );

  const scopeLabel = filterPostId
    ? (posts.find((p) => p.id === filterPostId)?.title || 'Selected news')
    : filterSubCategoryId
      ? `${selectedCategory?.name ?? 'Category'} › ${subcategories.find((s) => s.id === filterSubCategoryId)?.name ?? 'Subcategory'}`
      : filterCategoryId
        ? (selectedCategory?.name ?? 'Category')
        : 'All news';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#eef1f5' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '1.5rem 2rem', minWidth: 0 }}>
          {/* Top bar: title + date range */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-2"
                style={{ width: 40, height: 40, backgroundColor: 'rgba(13, 202, 240, 0.2)', color: '#087990' }}
              >
                <i className="bi bi-bar-chart-line" style={{ fontSize: '1.25rem' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1f2e', marginBottom: 0 }}>
                  News engagement
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: 0 }}>
                  {scopeLabel}
                  {queryDateFrom && queryDateTo && (
                    <span className="ms-2">
                      · Counts for {queryDateFrom === queryDateTo
                        ? queryDateFrom
                        : `${queryDateFrom} – ${queryDateTo}`}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: 140 }}
                value={dateRangePreset}
                onChange={(e) => setDateRangePreset(e.target.value)}
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {dateRangePreset === 'custom' && (
                <>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    style={{ width: 140 }}
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                  <span className="text-muted">–</span>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    style={{ width: 140 }}
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Summary metric cards – Instagram style */}
          <div className="d-flex flex-wrap gap-3 mb-4">
            <div
              className="rounded-3 p-3 flex-grow-1"
              style={{
                minWidth: 140,
                maxWidth: 220,
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef',
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <span className="small text-muted">Engagement</span>
                <i className="bi bi-lightning-charge text-warning" style={{ fontSize: '1.1rem' }} />
              </div>
              <div className="h4 mb-0 mt-1" style={{ color: '#1a1f2e', fontWeight: 700 }}>
                {postsToShow.length}
              </div>
              <div className="small text-muted">news in scope</div>
            </div>
            <div
              className="rounded-3 p-3 flex-grow-1"
              style={{
                minWidth: 140,
                maxWidth: 220,
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef',
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <span className="small text-muted">Likes</span>
                <i className="bi bi-heart-fill text-danger" style={{ fontSize: '1.1rem' }} />
              </div>
              <div className="h4 mb-0 mt-1" style={{ color: '#1a1f2e', fontWeight: 700 }}>
                {totalLikes}
              </div>
            </div>
            <div
              className="rounded-3 p-3 flex-grow-1"
              style={{
                minWidth: 140,
                maxWidth: 220,
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef',
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <span className="small text-muted">Comments</span>
                <i className="bi bi-chat-dots-fill text-primary" style={{ fontSize: '1.1rem' }} />
              </div>
              <div className="h4 mb-0 mt-1" style={{ color: '#1a1f2e', fontWeight: 700 }}>
                {totalComments}
              </div>
            </div>
            <div
              className="rounded-3 p-3 flex-grow-1"
              style={{
                minWidth: 140,
                maxWidth: 220,
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef',
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <span className="small text-muted">Saved</span>
                <i className="bi bi-bookmark-fill" style={{ fontSize: '1.1rem', color: '#087990' }} />
              </div>
              <div className="h4 mb-0 mt-1" style={{ color: '#1a1f2e', fontWeight: 700 }}>
                {totalSaved}
              </div>
            </div>
          </div>

          {/* Filters row */}
          <div
            className="rounded-3 p-3 mb-4"
            style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}
          >
            <div className="small text-muted mb-2">Filters</div>
            {loading ? (
              <p className="text-muted small mb-0">Loading…</p>
            ) : (
              <div className="d-flex flex-wrap gap-3 align-items-end">
                <div style={{ minWidth: 160 }}>
                  <label className="form-label small mb-1">Category</label>
                  <select
                    className="form-select form-select-sm"
                    value={filterCategoryId}
                    onChange={(e) => setFilterCategoryId(e.target.value)}
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ minWidth: 160 }}>
                  <label className="form-label small mb-1">Subcategory</label>
                  <select
                    className="form-select form-select-sm"
                    value={filterSubCategoryId}
                    onChange={(e) => setFilterSubCategoryId(e.target.value)}
                    disabled={!subcategories.length}
                  >
                    <option value="">All subcategories</option>
                    {subcategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ minWidth: 200 }}>
                  <label className="form-label small mb-1">News (post)</label>
                  <select
                    className="form-select form-select-sm"
                    value={filterPostId}
                    onChange={(e) => setFilterPostId(e.target.value)}
                  >
                    <option value="">All news</option>
                    {filteredPosts.map((p) => (
                      <option key={p.id} value={p.id}>{p.title || 'Untitled'}</option>
                    ))}
                  </select>
                </div>
                <div style={{ minWidth: 120 }}>
                  <label className="form-label small mb-1">Date from</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                <div style={{ minWidth: 120 }}>
                  <label className="form-label small mb-1">Date to</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Engagement graphs – above news performance table */}
          <div
            className="rounded-3 overflow-hidden mb-4"
            style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}
          >
            <div className="px-3 py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ backgroundColor: '#f8f9fa' }}>
              <div>
                <h2 className="h6 mb-0" style={{ color: '#1a1f2e', fontWeight: 600 }}>
                  Engagement overview
                </h2>
                <p className="small text-muted mb-0 mt-1">
                  {filterPostId && postsToShow.length === 1
                    ? <>Showing analytics for: <strong style={{ color: '#1a1f2e' }}>{postsToShow[0]?.title || 'Selected news'}</strong>. Line, bar, and donut show this post&apos;s likes, comments, and saved.</>
                    : <>{postsToShow.length} {postsToShow.length === 1 ? 'post' : 'posts'} in scope. Choose Line, Bar, or Donut. Select a single news in the filter to see that post&apos;s analytics in the charts.</>}
                </p>
              </div>
              <div className="d-flex align-items-center gap-1">
                {(['line', 'bar', 'donut'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    className="btn btn-sm d-flex align-items-center gap-2 rounded-2 border-0"
                    style={{
                      backgroundColor: graphView === view ? 'rgba(13, 202, 240, 0.15)' : 'transparent',
                      color: graphView === view ? '#087990' : '#6c757d',
                      fontWeight: graphView === view ? 600 : 400,
                    }}
                    onClick={() => setGraphView(view)}
                  >
                    {view === 'line' && <i className="bi bi-graph-up" />}
                    {view === 'bar' && <i className="bi bi-bar-chart-fill" />}
                    {view === 'donut' && <i className="bi bi-pie-chart-fill" />}
                    <span className="text-capitalize">{view}</span>
                  </button>
                ))}
              </div>
            </div>
            <div
              className="p-4 position-relative"
              onMouseLeave={() => setChartTooltip(null)}
            >
              {chartTooltip && (
                <div
                  className="position-fixed px-2 py-1 small rounded shadow-sm border"
                  style={{
                    left: chartTooltip.x + 12,
                    top: chartTooltip.y + 12,
                    backgroundColor: '#1a1f2e',
                    color: '#fff',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {chartTooltip.text}
                </div>
              )}
              {postsToShow.length === 0 ? (
                <p className="text-muted text-center py-4 mb-0 small">Select category/subcategory to see engagement graphs.</p>
              ) : (
                <>
                  {graphView === 'line' && (() => {
                    const data = [
                      { label: 'Likes', value: totalLikes },
                      { label: 'Comments', value: totalComments },
                      { label: 'Saved', value: totalSaved },
                    ];
                    const maxVal = Math.max(totalLikes, totalComments, totalSaved, 1);
                    const w = 320;
                    const h = 200;
                    const pad = { top: 16, right: 16, bottom: 36, left: 40 };
                    const x = (i: number) => pad.left + (i / (data.length - 1 || 1)) * (w - pad.left - pad.right);
                    const y = (v: number) => h - pad.bottom - (v / maxVal) * (h - pad.top - pad.bottom);
                    const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
                    const areaPoints = `${pad.left},${h - pad.bottom} ${points} ${w - pad.right},${h - pad.bottom}`;
                    return (
                      <div className="d-flex flex-column align-items-center">
                        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 480, height: 'auto' }} className="mb-2">
                          <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0d6efd" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#0d6efd" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          <polyline points={areaPoints} fill="url(#lineGrad)">
                            <title>Engagement: Likes, Comments, Saved</title>
                          </polyline>
                          <polyline
                            points={points}
                            fill="none"
                            stroke="#0d6efd"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <title>Engagement trend</title>
                          </polyline>
                          {data.map((d, i) => (
                            <g
                              key={d.label}
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => setChartTooltip({ text: `${d.label}: ${d.value}`, x: e.clientX, y: e.clientY })}
                              onMouseLeave={() => setChartTooltip(null)}
                            >
                              <circle cx={x(i)} cy={y(d.value)} r="8" fill="transparent" stroke="none" />
                              <circle cx={x(i)} cy={y(d.value)} r="4" fill="#0d6efd" />
                            </g>
                          ))}
                          {data.map((d, i) => (
                            <text key={d.label} x={x(i)} y={h - 8} textAnchor="middle" className="small" fill="#6c757d">
                              {d.label}
                            </text>
                          ))}
                        </svg>
                        <div className="d-flex gap-4 small">
                          {data.map((d) => (
                            <span key={d.label}>
                              <strong style={{ color: '#1a1f2e' }}>{d.value}</strong>
                              <span className="text-muted ms-1">{d.label}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {graphView === 'bar' && (
                    <>
                      <div className="mb-4">
                        <div className="small text-muted mb-2 fw-medium">Totals</div>
                        <div className="d-flex align-items-end gap-4" style={{ height: 200 }}>
                          {(() => {
                            const maxVal = Math.max(totalLikes, totalComments, totalSaved, 1);
                            const chartData = [
                              { label: 'Likes', value: totalLikes, color: '#dc3545', icon: 'bi-heart-fill' },
                              { label: 'Comments', value: totalComments, color: '#0d6efd', icon: 'bi-chat-dots-fill' },
                              { label: 'Saved', value: totalSaved, color: '#087990', icon: 'bi-bookmark-fill' },
                            ];
                            return chartData.map(({ label, value, color, icon }) => {
                              const pct = maxVal ? (value / maxVal) * 100 : 0;
                              return (
                                <div
                                  key={label}
                                  className="d-flex flex-column align-items-center flex-grow-1"
                                  style={{ minWidth: 0 }}
                                  onMouseEnter={(e) => setChartTooltip({ text: `${label}: ${value}`, x: e.clientX, y: e.clientY })}
                                  onMouseLeave={() => setChartTooltip(null)}
                                >
                                  <div
                                    className="rounded-2 w-100"
                                    style={{
                                      height: 180,
                                      backgroundColor: '#f1f3f5',
                                      display: 'flex',
                                      alignItems: 'flex-end',
                                      justifyContent: 'center',
                                      paddingBottom: 4,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <div
                                      className="rounded-2"
                                      style={{
                                        width: '70%',
                                        minHeight: value > 0 ? 8 : 0,
                                        height: `${Math.max(pct, value > 0 ? 2 : 0)}%`,
                                        backgroundColor: color,
                                        transition: 'height 0.35s ease',
                                      }}
                                    />
                                  </div>
                                  <div className="d-flex align-items-center gap-1 mt-2">
                                    <i className={`bi ${icon}`} style={{ color, fontSize: '0.875rem' }} />
                                    <span className="small fw-semibold" style={{ color: '#1a1f2e' }}>{value}</span>
                                  </div>
                                  <span className="small text-muted">{label}</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                      {(() => {
                        const maxTotal = Math.max(
                          ...postsToShow.map((p) => (likesMap[p.id] ?? 0) + (commentCountsMap[p.id] ?? 0) + (savedCountsMap[p.id] ?? 0)),
                          1,
                        );
                        return (
                          <div>
                            <div className="small text-muted mb-2 fw-medium">By news</div>
                            <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                              {postsToShow.slice(0, 15).map((post) => {
                                const likes = likesMap[post.id] ?? 0;
                                const comments = commentCountsMap[post.id] ?? 0;
                                const saved = savedCountsMap[post.id] ?? 0;
                                const total = likes + comments + saved || 1;
                                const widthPct = maxTotal ? (total / maxTotal) * 100 : 0;
                                const title = (post.title || 'Untitled').slice(0, 50) + (post.title && post.title.length > 50 ? '…' : '');
                                return (
                                  <div key={post.id} className="d-flex align-items-center gap-2">
                                    <span className="small text-truncate" style={{ minWidth: 0, maxWidth: 180 }} title={post.title || 'Untitled'}>
                                      {title}
                                    </span>
                                    <div className="flex-grow-1 rounded-2 d-flex" style={{ height: 24, backgroundColor: '#e9ecef', overflow: 'hidden', minWidth: 60 }}>
                                      {likes > 0 && (
                                        <div
                                          style={{ width: `${(likes / total) * widthPct}%`, backgroundColor: '#dc3545', minWidth: likes > 0 ? 2 : 0 }}
                                          onMouseEnter={(e) => setChartTooltip({ text: `Likes: ${likes}`, x: e.clientX, y: e.clientY })}
                                          onMouseLeave={() => setChartTooltip(null)}
                                        />
                                      )}
                                      {comments > 0 && (
                                        <div
                                          style={{ width: `${(comments / total) * widthPct}%`, backgroundColor: '#0d6efd', minWidth: comments > 0 ? 2 : 0 }}
                                          onMouseEnter={(e) => setChartTooltip({ text: `Comments: ${comments}`, x: e.clientX, y: e.clientY })}
                                          onMouseLeave={() => setChartTooltip(null)}
                                        />
                                      )}
                                      {saved > 0 && (
                                        <div
                                          style={{ width: `${(saved / total) * widthPct}%`, backgroundColor: '#087990', minWidth: saved > 0 ? 2 : 0 }}
                                          onMouseEnter={(e) => setChartTooltip({ text: `Saved: ${saved}`, x: e.clientX, y: e.clientY })}
                                          onMouseLeave={() => setChartTooltip(null)}
                                        />
                                      )}
                                    </div>
                                    <span className="small text-muted" style={{ minWidth: 28, textAlign: 'right' }}>{total}</span>
                                  </div>
                                );
                              })}
                              {postsToShow.length > 15 && <p className="small text-muted mb-0 mt-1">Showing top 15 of {postsToShow.length} news.</p>}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {graphView === 'donut' && (() => {
                    const total = totalLikes + totalComments + totalSaved || 1;
                    const pctL = total ? (totalLikes / total) * 100 : 0;
                    const pctC = total ? (totalComments / total) * 100 : 0;
                    const pctS = total ? (totalSaved / total) * 100 : 0;
                    const r = 80;
                    const cx = 100;
                    const cy = 100;
                    const stroke = 24;
                    const circumference = 2 * Math.PI * (r - stroke / 2);
                    const dash = (p: number) => (p / 100) * circumference;
                    const offset2 = dash(pctL);
                    const offset3 = dash(pctL) + dash(pctC);
                    return (
                      <div className="d-flex flex-wrap align-items-center justify-content-center gap-4">
                        <div className="position-relative" style={{ width: 200, height: 200 }}>
                          <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                            <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#e9ecef" strokeWidth={stroke} />
                            <g
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => setChartTooltip({ text: `Likes: ${totalLikes} (${pctL.toFixed(0)}%)`, x: e.clientX, y: e.clientY })}
                              onMouseLeave={() => setChartTooltip(null)}
                            >
                              <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#dc3545" strokeWidth={stroke} strokeDasharray={`${dash(pctL)} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
                            </g>
                            <g
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => setChartTooltip({ text: `Comments: ${totalComments} (${pctC.toFixed(0)}%)`, x: e.clientX, y: e.clientY })}
                              onMouseLeave={() => setChartTooltip(null)}
                            >
                              <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#0d6efd" strokeWidth={stroke} strokeDasharray={`${dash(pctC)} ${circumference}`} strokeDashoffset={-offset2} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
                            </g>
                            <g
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => setChartTooltip({ text: `Saved: ${totalSaved} (${pctS.toFixed(0)}%)`, x: e.clientX, y: e.clientY })}
                              onMouseLeave={() => setChartTooltip(null)}
                            >
                              <circle cx={cx} cy={cy} r={r - stroke / 2} fill="none" stroke="#087990" strokeWidth={stroke} strokeDasharray={`${dash(pctS)} ${circumference}`} strokeDashoffset={-offset3} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
                            </g>
                          </svg>
                          <div className="position-absolute top-50 start-50 translate-middle text-center">
                            <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#1a1f2e' }}>{total}</div>
                            <div className="small text-muted">Total</div>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#dc3545' }} />
                            <span className="small">Likes <strong>{totalLikes}</strong> ({pctL.toFixed(0)}%)</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#0d6efd' }} />
                            <span className="small">Comments <strong>{totalComments}</strong> ({pctC.toFixed(0)}%)</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#087990' }} />
                            <span className="small">Saved <strong>{totalSaved}</strong> ({pctS.toFixed(0)}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Content performance table – news preview + metrics */}
          <div
            className="rounded-3 overflow-hidden"
            style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e9ecef' }}
          >
            <div className="px-3 py-2 border-bottom" style={{ backgroundColor: '#f8f9fa' }}>
              <h2 className="h6 mb-0" style={{ color: '#1a1f2e', fontWeight: 600 }}>
                News performance
              </h2>
              <p className="small text-muted mb-0 mt-1">
                Preview of news matching your filters. Likes and comments update with selection.
              </p>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#f8f9fa', color: '#6c757d', fontSize: '0.8125rem' }}>
                  <tr>
                    <th style={{ fontWeight: 600, width: '40%' }}>News</th>
                    <th style={{ fontWeight: 600, width: '15%', textAlign: 'right' }}>Likes</th>
                    <th style={{ fontWeight: 600, width: '15%', textAlign: 'right' }}>Comments</th>
                    <th style={{ fontWeight: 600, width: '15%', textAlign: 'right' }}>Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {postsToShow.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No news match the current filters. Try changing category or subcategory.
                      </td>
                    </tr>
                  ) : (
                    postsToShow.map((post) => {
                      const thumbUrl = parseFirstImageUrl(post.imageUrls);
                      const likes = likesMap[post.id] ?? 0;
                      const comments = commentCountsMap[post.id] ?? 0;
                      const saved = savedCountsMap[post.id] ?? 0;
                      return (
                        <tr key={post.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-2 flex-shrink-0 overflow-hidden"
                                style={{
                                  width: 56,
                                  height: 56,
                                  backgroundColor: '#e9ecef',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {thumbUrl ? (
                                  <img
                                    src={imageSrc(thumbUrl)}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <i className="bi bi-file-earmark-text text-muted" style={{ fontSize: '1.5rem' }} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div
                                  className="text-dark text-truncate"
                                  style={{ fontWeight: 500, maxWidth: 320 }}
                                  title={post.title || 'Untitled'}
                                >
                                  {post.title || 'Untitled'}
                                </div>
                                <div className="small text-muted">
                                  {post.subCategory?.name ?? ''}
                                  {post.subCategory?.category?.name ? ` · ${post.subCategory.category.name}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-end">
                            <span style={{ fontWeight: 600, color: '#1a1f2e' }}>{likes}</span>
                          </td>
                          <td className="text-end">
                            <span style={{ fontWeight: 600, color: '#1a1f2e' }}>{comments}</span>
                          </td>
                          <td className="text-end">
                            <span style={{ fontWeight: 600, color: '#1a1f2e' }}>{saved}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
