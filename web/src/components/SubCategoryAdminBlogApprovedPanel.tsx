import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

export function SubCategoryAdminBlogApprovedPanel() {
  const [viewId, setViewId] = useState<string | null>(null);
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['subcategory-admin', 'blogs', 'approved'],
    queryFn: () => subcategoryAdminBlogsService.getApproved(),
  });

  return (
    <>
      <p style={{ color: TEXT_MUTED, fontSize: '1rem', marginBottom: '1.5rem' }}>
        Draft (saved) or published blogs, as decided by the category admin.
      </p>
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : error ? (
        <p className="text-danger">Failed to load.</p>
      ) : rows.length === 0 ? (
        <p style={{ color: TEXT_MUTED }}>No approved blogs yet.</p>
      ) : (
        <div className="table-responsive card border-0 shadow-sm" style={{ borderRadius: 0 }}>
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ fontWeight: '600', color: TEXT_DARK }}>Title</th>
                <th style={{ fontWeight: '600', color: TEXT_DARK }}>Status</th>
                <th style={{ fontWeight: '600', color: TEXT_DARK }}>Subcategory</th>
                <th style={{ fontWeight: '600', color: TEXT_DARK, width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: BlogRow) => (
                <React.Fragment key={row.id}>
                  <tr>
                    <td style={{ fontWeight: '500', color: TEXT_DARK }}>{row.title}</td>
                    <td>
                      <span
                        className={`badge ${row.published ? 'bg-success' : 'bg-secondary'}`}
                        style={{ borderRadius: '4px' }}
                      >
                        {row.published ? 'Published' : 'Draft (saved)'}
                      </span>
                    </td>
                    <td style={{ color: TEXT_MUTED }}>{row.subCategory?.name ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          border: '1px solid #dee2e6',
                          borderRadius: '50px',
                          padding: '0.35rem 0.75rem',
                          color: TEXT_DARK,
                          fontWeight: '500',
                        }}
                        onClick={() => setViewId(viewId === row.id ? null : row.id)}
                        title="View details"
                        aria-label={`View details for ${row.title}`}
                      >
                        <i className="bi bi-eye" />
                      </button>
                    </td>
                  </tr>
                  {viewId === row.id && (
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <td colSpan={4} className="p-3">
                        <div className="text-break" style={{ whiteSpace: 'pre-wrap' }}>
                          {row.content}
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm mt-2"
                          style={{ borderRadius: 0 }}
                          onClick={() => setViewId(null)}
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
