import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';
import { imageSrc } from '../utils/image';

export function SubCategoryAdminBlogApprovedPanel() {
  const [viewBlog, setViewBlog] = useState<BlogRow | null>(null);
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['subcategory-admin', 'blogs', 'approved'],
    queryFn: () => subcategoryAdminBlogsService.getApproved(),
  });

  if (isLoading) {
    return <div className="admin-loading-state">Loading approved blogs…</div>;
  }
  if (error) {
    return <div className="admin-empty-state"><p>Failed to load approved blogs.</p></div>;
  }
  if (rows.length === 0) {
    return (
      <div className="admin-empty-state">
        <i className="bi bi-check-circle admin-category-dashboard__empty-icon" aria-hidden />
        <p className="admin-form-hint mb-0">No approved blogs yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Subcategory</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="admin-table__strong">{row.title}</td>
                <td>
                  <span
                    className={`admin-pill ${row.published ? 'admin-pill--status-done' : 'admin-pill--status-pending'}`}
                  >
                    {row.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>{row.subCategory?.name ?? '—'}</td>
                <td>
                  <button
                    type="button"
                    className="admin-icon-btn admin-icon-btn--edit"
                    title="View details"
                    aria-label={`View details for ${row.title}`}
                    onClick={() => setViewBlog(row)}
                  >
                    <i className="bi bi-eye" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewBlog ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setViewBlog(null)}>
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <h3 className="admin-modal__title mb-2">{viewBlog.title}</h3>
              <p className="admin-form-hint mb-3">
                {viewBlog.subCategory?.name ?? '—'} ·{' '}
                {viewBlog.published ? 'Published' : 'Draft (saved)'}
              </p>
              {viewBlog.content ? (
                <div className="admin-table__details mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                  {viewBlog.content}
                </div>
              ) : null}
              {viewBlog.coverImageUrl ? (
                <img
                  src={imageSrc(viewBlog.coverImageUrl)}
                  alt=""
                  className="mb-3"
                  style={{ maxHeight: 160, objectFit: 'cover', borderRadius: 8 }}
                />
              ) : null}
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setViewBlog(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
