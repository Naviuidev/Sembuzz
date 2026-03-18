import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';

export const SubCategoryAdminBlogCorrections = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'blogs', 'reverted'],
    queryFn: () => subcategoryAdminBlogsService.getReverted(),
  });

  const filtered = useMemo(() => {
    const withNotes = rows.filter((r) => r.revertNotes?.trim());
    if (!search.trim()) return withNotes;
    const q = search.toLowerCase();
    return withNotes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.subCategory?.name ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const goResubmit = (b: BlogRow) => {
    navigate('/subcategory-admin/post-blog', {
      state: {
        resubmitBlog: {
          title: b.title,
          content: b.content,
          coverImageUrl: b.coverImageUrl,
          subCategory: b.subCategory,
        },
      },
    });
  };

  return (
    <SubCategoryAdminLayout>
      <h1 className="mb-2" style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e' }}>
        Blog — suggestions
      </h1>
      <p className="text-muted mb-3">
        Category admin asked for changes. Edit and resubmit as a new post.
      </p>
      <input
        type="search"
        className="form-control mb-3"
        style={{ maxWidth: 320, borderRadius: 0 }}
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isLoading && <p>Loading…</p>}
      {!isLoading && filtered.length === 0 && <p className="text-muted">No suggestions.</p>}
      <div className="d-flex flex-column gap-3">
        {filtered.map((b) => (
          <div key={b.id} className="card border-0 shadow-sm" style={{ borderRadius: 0 }}>
            <div className="card-body">
              <h6 className="mb-2">{b.title}</h6>
              <p className="small text-muted mb-2">{b.subCategory?.name}</p>
              <p className="mb-2">
                <strong>Feedback:</strong> {b.revertNotes}
              </p>
              <button
                type="button"
                className="btn btn-dark btn-sm"
                style={{ borderRadius: 0 }}
                onClick={() => goResubmit(b)}
              >
                Revise & resubmit
              </button>
            </div>
          </div>
        ))}
      </div>
    </SubCategoryAdminLayout>
  );
};
