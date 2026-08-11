import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

export function SubCategoryAdminBlogRejectedPanel() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'blogs', 'rejected'],
    queryFn: () => subcategoryAdminBlogsService.getRejected(),
  });

  return (
    <>
      <p style={{ color: TEXT_MUTED, fontSize: '1rem', marginBottom: '1.5rem' }}>
        These blog submissions were not approved.
      </p>
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : rows.length === 0 ? (
        <p style={{ color: TEXT_MUTED }}>No rejected blogs.</p>
      ) : (
        <div className="table-responsive card border-0 shadow-sm" style={{ borderRadius: 0 }}>
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ fontWeight: '600', color: TEXT_DARK }}>Title</th>
                <th style={{ fontWeight: '600', color: TEXT_DARK }}>Subcategory</th>
                <th style={{ fontWeight: '600', color: TEXT_DARK }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {(rows as BlogRow[]).map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: '500', color: TEXT_DARK }}>{b.title}</td>
                  <td style={{ color: TEXT_MUTED }}>{b.subCategory?.name ?? '—'}</td>
                  <td style={{ color: '#dc3545', fontSize: '0.9rem' }}>{b.rejectNotes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
