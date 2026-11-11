import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { StatusPopup } from '../components/StatusPopup';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { MasterAdminCreateBlogForm } from '../components/masterAdmin/MasterAdminCreateBlogForm';
import {
  masterAdminSchoolsService,
  type MasterAdminSchoolBlogRow,
} from '../services/master-admin-schools.service';
import { masterAdminBlogsService } from '../services/master-admin-blogs.service';

type Phase = 'browse' | 'create' | 'edit';

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: unknown } } })?.response?.data;
  const msg = data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg)) return msg.filter(Boolean).join('. ');
  return fallback;
}

function blogStatusPill(row: MasterAdminSchoolBlogRow) {
  if (row.published) {
    return <span className="admin-pill admin-pill--status-done">Published</span>;
  }
  if (row.status === 'approved') {
    return <span className="admin-pill admin-pill--status-pending">Saved</span>;
  }
  return <span className="admin-pill admin-pill--neutral">{row.status}</span>;
}

export function MasterAdminBlogsPage() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [phase, setPhase] = useState<Phase>('browse');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [publishingBlogId, setPublishingBlogId] = useState<string | null>(null);
  const [popupShow, setPopupShow] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);
  const selectedSchoolName = schoolOptions.find((s) => s.id === selectedSchoolId)?.name ?? '';

  useEffect(() => {
    const fromUrl = searchParams.get('schoolId');
    if (!fromUrl || phase !== 'browse') return;
    if (schoolOptions.some((s) => s.id === fromUrl)) {
      setSelectedSchoolId(fromUrl);
    }
  }, [searchParams, schoolOptions, phase]);

  const { data: blogs = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools', selectedSchoolId, 'blogs'],
    queryFn: () => masterAdminSchoolsService.listBlogs(selectedSchoolId),
    enabled: Boolean(selectedSchoolId) && phase === 'browse',
  });

  const { data: editingBlog, isLoading: editingLoading } = useQuery({
    queryKey: ['master-admin', 'blogs', selectedSchoolId, editingBlogId],
    queryFn: () => masterAdminBlogsService.getBlog(selectedSchoolId, editingBlogId!),
    enabled: phase === 'edit' && Boolean(selectedSchoolId && editingBlogId),
  });

  const isComposer = phase === 'create' || phase === 'edit';

  const startCreate = () => {
    if (!selectedSchoolId) return;
    setEditingBlogId(null);
    setPhase('create');
  };

  const exitComposer = () => {
    setPhase('browse');
    setEditingBlogId(null);
  };

  const handleSaved = () => {
    void queryClient.invalidateQueries({ queryKey: ['master-admin', 'schools', selectedSchoolId, 'blogs'] });
    exitComposer();
  };

  const handleEdit = (row: MasterAdminSchoolBlogRow) => {
    setEditingBlogId(row.id);
    setPhase('edit');
  };

  const handlePublishRow = async (row: MasterAdminSchoolBlogRow) => {
    if (row.published || !selectedSchoolId) return;
    setPublishingBlogId(row.id);
    try {
      await masterAdminBlogsService.publish(selectedSchoolId, row.id);
      setPopupType('success');
      setPopupMessage(`"${row.title}" is now published for ${selectedSchoolName}.`);
      setPopupShow(true);
      void queryClient.invalidateQueries({ queryKey: ['master-admin', 'schools', selectedSchoolId, 'blogs'] });
    } catch (err: unknown) {
      setPopupType('error');
      setPopupMessage(apiErrorMessage(err, 'Could not publish this blog.'));
      setPopupShow(true);
    } finally {
      setPublishingBlogId(null);
    }
  };

  const composerSubtitle =
    phase === 'edit'
      ? 'Update blocks and preview, then Save. Publish from the blogs table for this school.'
      : 'Build your article, then Save. Return to the list and use Publish for the selected school.';

  return (
    <MasterAdminLayout>
      <div className="admin-posts-page">
        {isComposer ? (
          <>
            <header className="admin-page-header" style={panelStyle}>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                <div>
                  <h1 className="admin-page-title mb-1">{phase === 'edit' ? 'Edit blog' : 'Post blog'}</h1>
                  <p className="admin-page-subtitle mb-1">{composerSubtitle}</p>
                  <p className="admin-form-hint mb-0">
                    School: <strong>{selectedSchoolName}</strong>
                  </p>
                </div>
                <button type="button" className="admin-btn-secondary" onClick={exitComposer}>
                  <i className="bi bi-arrow-left me-2" aria-hidden />
                  Back to blogs
                </button>
              </div>
            </header>

            <section className="admin-panel" style={panelStyle}>
              <div className="admin-panel__body admin-panel__body--flush-top">
                {phase === 'create' ? (
                  <MasterAdminCreateBlogForm schoolId={selectedSchoolId} onSaved={handleSaved} />
                ) : editingLoading || !editingBlog ? (
                  <p className="master-admin-detail-muted mb-0">Loading blog…</p>
                ) : (
                  <MasterAdminCreateBlogForm
                    key={editingBlogId}
                    schoolId={selectedSchoolId}
                    blogId={editingBlogId!}
                    initialBlog={editingBlog}
                    onSaved={handleSaved}
                  />
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="admin-page-header" style={panelStyle}>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                <div>
                  <h1 className="admin-page-title mb-1">Blogs</h1>
                  <p className="admin-page-subtitle mb-0">
                    Select a school, view saved and published blogs, or post a new article.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={startCreate}
                  disabled={!selectedSchoolId}
                >
                  <i className="bi bi-plus-lg me-2" aria-hidden />
                  Post blog
                </button>
              </div>
            </header>

            <section className="admin-panel master-admin-posts-school-filter" style={panelStyle}>
              <div className="admin-panel__body">
                <label className="admin-form-label" htmlFor="ma-blogs-school-filter">
                  Select school
                </label>
                <select
                  id="ma-blogs-school-filter"
                  className="form-select admin-form-control master-admin-posts-school-filter__select"
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  disabled={schoolsLoading}
                >
                  <option value="">Choose school…</option>
                  {schoolOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {selectedSchoolId ? (
              <section className="admin-panel" style={panelStyle}>
                <div className="admin-panel__body">
                  <p className="admin-form-hint mb-3">
                    Showing blogs for <strong>{selectedSchoolName}</strong>. Saved drafts can be published from the
                    table below.
                  </p>
                  {isLoading ? (
                    <p className="master-admin-detail-muted mb-0">Loading blogs…</p>
                  ) : isError ? (
                    <p className="master-admin-detail-muted mb-0">Could not load blogs.</p>
                  ) : blogs.length === 0 ? (
                    <p className="master-admin-detail-muted mb-0">No blogs yet for this school.</p>
                  ) : (
                    <div className="admin-table-wrap master-admin-school-table-wrap">
                      <table className="admin-table master-admin-school-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Subcategory</th>
                            <th>Updated</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blogs.map((blog) => (
                            <tr key={blog.id}>
                              <td>
                                <span className="admin-table__strong">{blog.title}</span>
                              </td>
                              <td>{blog.subCategory.name}</td>
                              <td>{formatDate(blog.publishedAt ?? blog.createdAt)}</td>
                              <td>{blogStatusPill(blog)}</td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="admin-btn-secondary btn-sm me-1"
                                  onClick={() => handleEdit(blog)}
                                >
                                  Edit
                                </button>
                                {!blog.published ? (
                                  <button
                                    type="button"
                                    className="admin-btn-primary btn-sm"
                                    disabled={publishingBlogId === blog.id}
                                    onClick={() => void handlePublishRow(blog)}
                                  >
                                    {publishingBlogId === blog.id ? 'Publishing…' : 'Publish'}
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="admin-panel" style={panelStyle}>
                <div className="admin-panel__body">
                  <p className="master-admin-detail-muted mb-0">Choose a school above to view and post blogs.</p>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <StatusPopup show={popupShow} type={popupType} message={popupMessage} onClose={() => setPopupShow(false)} />
    </MasterAdminLayout>
  );
}
