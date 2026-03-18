import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';

export const SubCategoryAdminBlogApproved = () => {
  const [viewId, setViewId] = useState<string | null>(null);
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['subcategory-admin', 'blogs', 'approved'],
    queryFn: () => subcategoryAdminBlogsService.getApproved(),
  });

  return (
    <SubCategoryAdminLayout>
      <h1 className="mb-2" style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e' }}>
        Blogs — approved
      </h1>
      <p className="text-muted mb-4">
        Draft (saved) or published, as decided by category admin.
      </p>
      {isLoading && <p>Loading…</p>}
      {error && <p className="text-danger">Failed to load.</p>}
      {!isLoading && rows.length === 0 && <p className="text-muted">No approved blogs yet.</p>}
      {rows.length > 0 && (
        <div className="table-responsive card border-0 shadow-sm" style={{ borderRadius: 0 }}>
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Subcategory</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: BlogRow) => (
                <React.Fragment key={row.id}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start"
                        onClick={() => setViewId(viewId === row.id ? null : row.id)}
                      >
                        {row.title}
                      </button>
                    </td>
                    <td>
                      <span
                        className={`badge ${row.published ? 'bg-success' : 'bg-secondary'}`}
                        style={{ borderRadius: 0 }}
                      >
                        {row.published ? 'Published' : 'Draft (saved)'}
                      </span>
                    </td>
                    <td>{row.subCategory?.name ?? '—'}</td>
                  </tr>
                  {viewId === row.id && (
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <td colSpan={3} className="p-3">
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
    </SubCategoryAdminLayout>
  );
};
