import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  categoryAdminBlogsService,
  type BlogForCategoryAdmin,
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

const approvedQueryKey = ['category-admin', 'blogs', 'approved'] as const;

export function CategoryAdminBlogsApprovedPanel() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewBlog, setViewBlog] = useState<BlogForCategoryAdmin | null>(null);
  const [deleteBlog, setDeleteBlog] = useState<BlogForCategoryAdmin | null>(null);

  const { data: library = [], isLoading, error } = useQuery({
    queryKey: approvedQueryKey,
    queryFn: () => categoryAdminBlogsService.getApproved(),
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return library;
    const q = searchQuery.toLowerCase();
    return library.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.subCategory?.name ?? '').toLowerCase().includes(q) ||
        (b.subCategoryAdmin?.name ?? '').toLowerCase().includes(q),
    );
  }, [library, searchQuery]);

  const deleteM = useMutation({
    mutationFn: (id: string) => categoryAdminBlogsService.deleteApproved(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-admin', 'blogs'] });
      void invalidateAdminActionItems(queryClient, 'category-admin');
      setDeleteBlog(null);
      setViewBlog(null);
    },
  });

  return (
    <>
      {error ? (
        <div className="admin-notice mb-3">
          <p className="admin-form-hint admin-form-hint--error mb-0">Failed to load approved blogs.</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="admin-loading-state">
          <div className="spinner-border text-secondary" role="status" />
          <p className="mt-2 mb-0">Loading approved blogs…</p>
        </div>
      ) : library.length === 0 ? (
        <div className="admin-empty-state">
          <i className="bi bi-journal-check" style={{ fontSize: '2.5rem', opacity: 0.45 }} aria-hidden />
          <p className="mt-3 mb-0">No approved blogs yet.</p>
          <p className="small mb-0">Approve submissions from the Pending tab to publish them.</p>
        </div>
      ) : (
        <div className="admin-approved-posts">
          <div className="admin-approved-posts__toolbar">
            <span className="admin-approved-posts__count">
              {filtered.length} of {library.length} approved {library.length === 1 ? 'blog' : 'blogs'}
            </span>
            <div className="admin-approved-posts__search">
              <i className="bi bi-search" aria-hidden />
              <input
                type="search"
                className="form-control admin-form-control"
                placeholder="Search by title, subcategory, or author…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search approved blogs"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="admin-form-hint text-center py-4 mb-0">No blogs match your search.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-approved-posts__table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Subcategory</th>
                    <th>Author</th>
                    <th>Updated</th>
                    <th className="admin-approved-posts__actions-col" aria-label="Actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="admin-table__strong">{row.title}</span>
                        <span className="d-block mt-1">
                          <span className="admin-pill admin-pill--status-done">Live (public)</span>
                        </span>
                      </td>
                      <td>{row.subCategory?.name ?? '—'}</td>
                      <td>{row.subCategoryAdmin?.name ?? '—'}</td>
                      <td className="admin-table__details">{formatDate(row.updatedAt)}</td>
                      <td>
                        <div className="admin-table-actions admin-approved-posts__row-actions">
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
                            className="admin-icon-btn admin-icon-btn--danger"
                            aria-label={`Delete ${row.title}`}
                            onClick={() => setDeleteBlog(row)}
                          >
                            <i className="bi bi-trash" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            aria-labelledby="blog-approved-view-title"
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
              <h3 className="admin-modal__title" id="blog-approved-view-title">{viewBlog.title}</h3>
              <p className="mb-3">
                <span className="admin-pill admin-pill--status-done">Live (public)</span>
              </p>
              <div className="admin-detail-grid mb-3">
                <div>
                  <span className="admin-detail-label">Subcategory</span>
                  <p className="admin-detail-value mb-0">{viewBlog.subCategory?.name ?? '—'}</p>
                </div>
                <div>
                  <span className="admin-detail-label">Author</span>
                  <p className="admin-detail-value mb-0">{viewBlog.subCategoryAdmin?.name ?? '—'}</p>
                </div>
                <div>
                  <span className="admin-detail-label">Last updated</span>
                  <p className="admin-detail-value mb-0">{formatDate(viewBlog.updatedAt)}</p>
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
              <div className="admin-modal__footer admin-modal__footer--between mt-3">
                <button type="button" className="admin-btn-secondary" onClick={() => setViewBlog(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={() => {
                    setDeleteBlog(viewBlog);
                  }}
                >
                  Delete blog
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteBlog ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => !deleteM.isPending && setDeleteBlog(null)}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Delete blog?</h3>
              <p className="admin-modal__text">
                Permanently delete <strong>{deleteBlog.title}</strong>? It will be removed from the public Events
                feed and Blogs page.
              </p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setDeleteBlog(null)}
                  disabled={deleteM.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={() => deleteM.mutate(deleteBlog.id)}
                  disabled={deleteM.isPending}
                >
                  {deleteM.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
