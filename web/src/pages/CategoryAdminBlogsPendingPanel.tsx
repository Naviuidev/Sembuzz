import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  categoryAdminBlogsService,
  type BlogForCategoryAdmin,
  type UpdateBlogDto,
} from '../services/category-admin-blogs.service';
import { invalidateAdminActionItems } from '../services/admin-action-items.service';
import { imageSrc } from '../utils/image';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

const pendingQueryKey = ['category-admin', 'blogs', 'pending'] as const;

export function CategoryAdminBlogsPendingPanel() {
  const queryClient = useQueryClient();
  const [viewBlog, setViewBlog] = useState<BlogForCategoryAdmin | null>(null);
  const [editBlog, setEditBlog] = useState<BlogForCategoryAdmin | null>(null);
  const [editForm, setEditForm] = useState<UpdateBlogDto>({});
  const [revertBlog, setRevertBlog] = useState<BlogForCategoryAdmin | null>(null);
  const [revertNotes, setRevertNotes] = useState('');
  const [rejectBlog, setRejectBlog] = useState<BlogForCategoryAdmin | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [approveBlog, setApproveBlog] = useState<BlogForCategoryAdmin | null>(null);

  const { data: pending = [], isLoading, error } = useQuery({
    queryKey: pendingQueryKey,
    queryFn: () => categoryAdminBlogsService.getPending(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['category-admin', 'blogs'] });
    void invalidateAdminActionItems(queryClient, 'category-admin');
  };

  const updateM = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBlogDto }) =>
      categoryAdminBlogsService.update(id, dto),
    onSuccess: () => {
      invalidate();
      setEditBlog(null);
    },
  });

  const revertM = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      categoryAdminBlogsService.revert(id, notes),
    onSuccess: () => {
      invalidate();
      setRevertBlog(null);
      setRevertNotes('');
      setViewBlog(null);
    },
  });

  const rejectM = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      categoryAdminBlogsService.reject(id, notes),
    onSuccess: () => {
      invalidate();
      setRejectBlog(null);
      setRejectNotes('');
      setViewBlog(null);
    },
  });

  const approveM = useMutation({
    mutationFn: (id: string) => categoryAdminBlogsService.approve(id),
    onSuccess: () => {
      invalidate();
      setApproveBlog(null);
      setViewBlog(null);
    },
  });

  const openEdit = (row: BlogForCategoryAdmin) => {
    setEditBlog(row);
    setEditForm({
      title: row.title,
      content: row.content,
      coverImageUrl: row.coverImageUrl,
    });
  };

  return (
    <>
      {error ? (
        <div className="admin-notice mb-3">
          <p className="admin-form-hint admin-form-hint--error mb-0">Failed to load pending blogs.</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="admin-loading-state">
          <div className="spinner-border text-secondary" role="status" />
          <p className="mt-2 mb-0">Loading pending blogs…</p>
        </div>
      ) : pending.length === 0 ? (
        <div className="admin-empty-state">
          <i className="bi bi-journal-text" style={{ fontSize: '2.5rem', opacity: 0.45 }} aria-hidden />
          <p className="mt-3 mb-0">No blog posts awaiting approval.</p>
        </div>
      ) : (
        <div className="admin-approved-posts">
          <div className="admin-approved-posts__toolbar">
            <span className="admin-approved-posts__count">
              {pending.length} pending {pending.length === 1 ? 'blog' : 'blogs'}
            </span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table admin-approved-posts__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subcategory</th>
                  <th>Author</th>
                  <th>Submitted</th>
                  <th className="admin-approved-posts__actions-col" aria-label="Actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="admin-table__strong">{row.title}</span>
                    </td>
                    <td>{row.subCategory?.name ?? '—'}</td>
                    <td>
                      {row.subCategoryAdmin?.name ?? '—'}
                      {row.subCategoryAdmin?.email ? (
                        <span className="d-block admin-form-hint">{row.subCategoryAdmin.email}</span>
                      ) : null}
                    </td>
                    <td className="admin-table__details">{formatDate(row.createdAt)}</td>
                    <td>
                      <div className="admin-table-actions admin-approved-posts__row-actions admin-pending-posts__actions">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          aria-label={`View ${row.title}`}
                          onClick={() => setViewBlog(row)}
                        >
                          <i className="bi bi-eye" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--edit"
                          aria-label={`Edit ${row.title}`}
                          onClick={() => openEdit(row)}
                        >
                          <i className="bi bi-pencil" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          aria-label={`Approve ${row.title}`}
                          title="Approve"
                          onClick={() => setApproveBlog(row)}
                        >
                          <i className="bi bi-check-lg" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          aria-label={`Suggest changes for ${row.title}`}
                          title="Suggest changes"
                          onClick={() => {
                            setRevertBlog(row);
                            setRevertNotes('');
                          }}
                        >
                          <i className="bi bi-arrow-return-left" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--danger"
                          aria-label={`Reject ${row.title}`}
                          title="Reject"
                          onClick={() => {
                            setRejectBlog(row);
                            setRejectNotes('');
                          }}
                        >
                          <i className="bi bi-x-lg" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewBlog ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => setViewBlog(null)}
          role="presentation"
        >
          <div
            className="admin-modal admin-modal--lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-pending-view-title"
          >
            <button
              type="button"
              className="admin-modal__close"
              aria-label="Close"
              onClick={() => setViewBlog(null)}
            >
              <i className="bi bi-x-lg" aria-hidden />
            </button>
            <div className="admin-modal__body admin-modal__body--with-close admin-modal__scroll">
              <h3 className="admin-modal__title" id="blog-pending-view-title">{viewBlog.title}</h3>
              <div className="admin-detail-grid mb-3">
                <div>
                  <span className="admin-detail-label">Subcategory</span>
                  <p className="admin-detail-value mb-0">{viewBlog.subCategory?.name ?? '—'}</p>
                </div>
                <div>
                  <span className="admin-detail-label">Author</span>
                  <p className="admin-detail-value mb-0">
                    {viewBlog.subCategoryAdmin?.name ?? '—'}
                    {viewBlog.subCategoryAdmin?.email ? ` · ${viewBlog.subCategoryAdmin.email}` : ''}
                  </p>
                </div>
                <div>
                  <span className="admin-detail-label">Submitted</span>
                  <p className="admin-detail-value mb-0">{formatDate(viewBlog.createdAt)}</p>
                </div>
              </div>
              {viewBlog.coverImageUrl ? (
                <img
                  src={imageSrc(viewBlog.coverImageUrl)}
                  alt=""
                  className="admin-blog-view__cover mb-3"
                />
              ) : null}
              <div className="admin-blog-view__content mb-3">{viewBlog.content}</div>
              {parseImageUrls(viewBlog.imageUrls).length > 0 ? (
                <div className="admin-create-post-upload-thumbs mb-3">
                  {parseImageUrls(viewBlog.imageUrls).map((u, i) => (
                    <a key={i} href={imageSrc(u)} target="_blank" rel="noopener noreferrer">
                      <img src={imageSrc(u)} alt="" width={72} height={72} />
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="admin-modal__footer admin-modal__footer--between">
                <button type="button" className="admin-btn-secondary" onClick={() => setViewBlog(null)}>
                  Close
                </button>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="admin-btn-secondary" onClick={() => openEdit(viewBlog)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => {
                      setRevertBlog(viewBlog);
                      setRevertNotes('');
                    }}
                  >
                    Suggest changes
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() => {
                      setRejectBlog(viewBlog);
                      setRejectNotes('');
                    }}
                  >
                    Reject
                  </button>
                  <button type="button" className="admin-btn-primary" onClick={() => setApproveBlog(viewBlog)}>
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {approveBlog ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => !approveM.isPending && setApproveBlog(null)}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Approve blog</h3>
              <p className="admin-modal__text">
                Approve <strong>{approveBlog.title}</strong>? It will be public on the Events feed and Blogs page.
              </p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setApproveBlog(null)}
                  disabled={approveM.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => approveM.mutate(approveBlog.id)}
                  disabled={approveM.isPending}
                >
                  {approveM.isPending ? 'Approving…' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editBlog ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => !updateM.isPending && setEditBlog(null)}
          role="presentation"
        >
          <div
            className="admin-modal admin-modal--lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="admin-modal__close"
              aria-label="Close"
              onClick={() => setEditBlog(null)}
            >
              <i className="bi bi-x-lg" aria-hidden />
            </button>
            <div className="admin-modal__body admin-modal__body--with-close">
              <h3 className="admin-modal__title">Edit before approval</h3>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="blog-edit-title">Title</label>
                <input
                  id="blog-edit-title"
                  className="form-control admin-form-control"
                  value={editForm.title ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="admin-form-section">
                <label className="admin-form-label" htmlFor="blog-edit-content">Content</label>
                <textarea
                  id="blog-edit-content"
                  className="form-control admin-form-control"
                  rows={12}
                  value={editForm.content ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                />
              </div>
              <div className="admin-modal__footer admin-modal__footer--between">
                <button type="button" className="admin-btn-secondary" onClick={() => setEditBlog(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={updateM.isPending}
                  onClick={() => editBlog && updateM.mutate({ id: editBlog.id, dto: editForm })}
                >
                  {updateM.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {revertBlog ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => !revertM.isPending && setRevertBlog(null)}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Suggest changes</h3>
              <p className="admin-form-hint mb-2">{revertBlog.title}</p>
              <textarea
                className="form-control admin-form-control mb-3"
                rows={5}
                placeholder="Feedback for the author…"
                value={revertNotes}
                onChange={(e) => setRevertNotes(e.target.value)}
              />
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setRevertBlog(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={!revertNotes.trim() || revertM.isPending}
                  onClick={() =>
                    revertBlog && revertM.mutate({ id: revertBlog.id, notes: revertNotes.trim() })
                  }
                >
                  {revertM.isPending ? 'Sending…' : 'Send back'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {rejectBlog ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => !rejectM.isPending && setRejectBlog(null)}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Reject blog</h3>
              <p className="admin-form-hint mb-2">{rejectBlog.title}</p>
              <textarea
                className="form-control admin-form-control mb-3"
                rows={5}
                placeholder="Reason (required)…"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
              />
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setRejectBlog(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  disabled={!rejectNotes.trim() || rejectM.isPending}
                  onClick={() =>
                    rejectBlog && rejectM.mutate({ id: rejectBlog.id, notes: rejectNotes.trim() })
                  }
                >
                  {rejectM.isPending ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
