import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';

export function SubCategoryAdminBlogRejectedPanel() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'blogs', 'rejected'],
    queryFn: () => subcategoryAdminBlogsService.getRejected(),
  });

  if (isLoading) {
    return <div className="admin-loading-state">Loading rejected blogs…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="admin-empty-state">
        <i className="bi bi-x-circle admin-category-dashboard__empty-icon" aria-hidden />
        <p className="admin-form-hint mb-0">No rejected blog submissions.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Subcategory</th>
            <th scope="col">Reason</th>
          </tr>
        </thead>
        <tbody>
          {(rows as BlogRow[]).map((b) => (
            <tr key={b.id}>
              <td className="admin-table__strong">{b.title}</td>
              <td>{b.subCategory?.name ?? '—'}</td>
              <td className="admin-form-hint admin-form-hint--error">{b.rejectNotes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
