import { useQuery } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';

export const SubCategoryAdminBlogRejected = () => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'blogs', 'rejected'],
    queryFn: () => subcategoryAdminBlogsService.getRejected(),
  });

  return (
    <SubCategoryAdminLayout>
      <h1 className="mb-2" style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e' }}>
        Blogs — rejected
      </h1>
      <p className="text-muted mb-4">These submissions were not approved.</p>
      {isLoading && <p>Loading…</p>}
      {!isLoading && rows.length === 0 && <p className="text-muted">No rejected blogs.</p>}
      <div className="d-flex flex-column gap-3">
        {(rows as BlogRow[]).map((b) => (
          <div key={b.id} className="card border-0 shadow-sm" style={{ borderRadius: 0 }}>
            <div className="card-body">
              <h6 className="mb-2">{b.title}</h6>
              <p className="small text-muted mb-2">{b.subCategory?.name}</p>
              {b.rejectNotes && (
                <p className="mb-0 text-danger">
                  <strong>Reason:</strong> {b.rejectNotes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </SubCategoryAdminLayout>
  );
};
