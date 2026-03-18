import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export const SubCategoryAdminBlogPending = () => {
  const [viewId, setViewId] = useState<string | null>(null);
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['subcategory-admin', 'blogs', 'pending'],
    queryFn: () => subcategoryAdminBlogsService.getPending(),
  });

  const detail = (row: BlogRow) => (
    <tr key={`${row.id}-d`} style={{ backgroundColor: '#f8f9fa' }}>
      <td colSpan={3} className="p-3">
        <div className="text-break" style={{ whiteSpace: 'pre-wrap' }}>
          {row.content}
        </div>
        {row.coverImageUrl && (
          <img src={row.coverImageUrl} alt="" className="mt-2" style={{ maxHeight: 120 }} />
        )}
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
  );

  return (
    <SubCategoryAdminLayout>
      <h1 className="mb-2" style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e' }}>
        Blogs — pending approval
      </h1>
      <p className="text-muted mb-4">Waiting for category admin.</p>
      {isLoading && <p>Loading…</p>}
      {error && <p className="text-danger">Failed to load.</p>}
      {!isLoading && rows.length === 0 && <p className="text-muted">No pending blogs.</p>}
      {rows.length > 0 && (
        <div className="table-responsive card border-0 shadow-sm" style={{ borderRadius: 0 }}>
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subcategory</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start text-decoration-none"
                        onClick={() => setViewId(viewId === row.id ? null : row.id)}
                      >
                        {row.title}
                      </button>
                    </td>
                    <td>{row.subCategory?.name ?? '—'}</td>
                    <td>{formatDate(row.createdAt)}</td>
                  </tr>
                  {viewId === row.id && detail(row)}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SubCategoryAdminLayout>
  );
};
